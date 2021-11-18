const { parseSqlResultToJson, renderFile } = require("../CommonHelper");
const UrlWindow = require("./urlwindow");

class Paginator {
    static request;
    constructor(items, total, perPage, options) {
        this.options = options;
        this.total = total;
        this.items = items;
        this.perPage = perPage;
        Object.entries(options).forEach(([index, item]) => {
            this[`${index}`] = item;
        });
        this.lastPage = Math.max(
            parseInt(Math.ceil(this.total / this.perPage)),
            1
        );
        this.currentPage = this.currentPage
            ? this.currentPage
            : Number(Paginator.request.query.page ?? 1);
        this.onEachSide = this.onEachSide ?? 3;
    }

    static init = async ({ query, perPage, request, ...options }) => {
        let items = await Paginator.getItems(
            query,
            perPage,
            Number(request.query.page ?? 1)
        );
        let total = Number(await Paginator.getTotal(query)) ?? 0;
        Paginator.request = request;
        let paginator = new Paginator(items, total, perPage, options);
        return paginator;
    };

    links = (view = "/layouts/pagination.ejs", data = {}) => {
        return this.render(view, data);
    };

    render = async (view, data) => {
        let renderedView = await renderFile(view, {
            ...data,
            ...{ paginator: this, elements: this.elements() },
        });
        return renderedView;
    };

    elements = () => {
        let window = UrlWindow.make(this);
        return [
            window.first,
            window.slider ? "..." : null,
            window.slider,
            window.last ? "..." : null,
            window.last,
        ];
    };

    total = () => this.total;

    hasMorePages = () => this.getCurrentPage() < this.getLastPage();

    nextPageUrl = () => {
        if (this.getLastPage() > this.getCurrentPage()) {
            return this.url(this.getCurrentPage() + 1);
        }
        return null;
    };

    previousPageUrl = () => {
        if (this.getCurrentPage() > 1) {
            return this.url(this.getCurrentPage() - 1);
        }
    };

    getLastPage = () => this.lastPage;

    getCurrentPage = () => this.currentPage;

    toArray = () => {
        return {
            current_page: this.getCurrentPage(),
            data: this.items,
            first_page_url: this.url(1),
            from: this.firstItem(),
            last_page: this.getLastPage(),
            last_page_url: this.url(this.getLastPage()),
            next_page_url: this.nextPageUrl(),
            path: this.path(),
            per_page: this.perPage,
            prev_page_url: this.previousPageUrl(),
            to: this.lastItem(),
            total: this.total(),
        };
    };

    static getItems = async (query, perPage = 20, currentPage = 1) => {
        if (!query) throw new Error("Invalid query");
        let limit = perPage;
        let offset = limit * (currentPage - 1);
        query += ` LIMIT ${limit} OFFSET ${offset}`;
        return parseSqlResultToJson(await global.mysql.sqlQuery(query));
    };

    static async getTotal(query) {
        let queryArray = query.toLowerCase().split(" ");
        let tableIndex = queryArray.indexOf("from") + 1;
        let tableName = queryArray[queryArray.indexOf("from") + 1];
        queryArray = queryArray.slice(tableIndex + 1);
        let totalCountQuery = `SELECT COUNT(*) as total_count FROM ${tableName} ${queryArray.join(
            " "
        )}`;
        return (
            parseSqlResultToJson(
                await global.mysql.sqlQuery(totalCountQuery)
            )[0].total_count ?? 0
        );
    }

    getUrlRange = (start, end) => {
        let urls = {};
        for (let i = start; i <= end; i++) {
            urls[`${i}`] = this.url(i);
        }
        return urls;
    };

    url = (page) => {
        if (page <= 0) page = 1;
        let request = Paginator.request;
        request.query["page"] = page;
        let url = request.originalUrl.split("?")[0];
        let count = 0;
        for (const [key, value] of Object.entries(request.query)) {
            if (count == 0) url += `?${key}=${value}`;
            else url += `&${key}=${value}`;
            count++;
        }
        return url;
    };

    onFirstPage = () => {
        return this.getCurrentPage() <= 1;
    };

    firstItem = () => {
        return Object.keys(this.items).length > 0
            ? (this.getCurrentPage - 1) * this.perPage + 1
            : null;
    };

    lastItem = () => {
        return Object.keys(this.items).length > 0
            ? this.firstItem() + this.count() - 1
            : null;
    };

    count = () => Object.keys(this.items).length;

    hasPages = () => this.getCurrentPage() != 1 || this.hasMorePages();
}

module.exports = Paginator;
