class UrlWindow {
    constructor(paginator) {
        this.paginator = paginator;
    }

    static make(paginator) {
        let urlWindow = new UrlWindow(paginator);
        return urlWindow.get();
    }

    get = () => {
        let onEachSide = Number(this.paginator.onEachSide);
        if (this.paginator.getLastPage() < onEachSide * 2 + 6) {
            return this.getSmallSlider();
        }
        return this.getUrlSlider(onEachSide);
    };

    getSmallSlider = () => {
        return {
            first: this.paginator.getUrlRange(1, this.getLastPage()),
            slider: null,
            last: null,
        };
    };

    getUrlSlider = (onEachSide) => {
        let window = onEachSide * 2;
        if (!this.hasPages()) return { first: null, slider: null, last: null };
        if (this.getCurrentPage() <= window)
            return this.getSliderTooCloseToBeginning(window);
        else if (this.getCurrentPage() > this.getLastPage() - window) {
            return this.getSliderTooCloseToEnding(window);
        }
        return this.getFullSlider(onEachSide);
    };

    getSliderTooCloseToBeginning = (window) => {
        return {
            first: this.paginator.getUrlRange(1, window + 2),
            slider: null,
            last: this.getFinish(),
        };
    };

    getSliderTooCloseToEnding = (window) => {
        let last = this.paginator.getUrlRange(
            this.getLastPage() - (window + 2),
            this.getLastPage()
        );
        return {
            first: this.getStart(),
            slider: null,
            last: last,
        };
    };

    getFullSlider = (onEachSide) => {
        return {
            first: this.getStart(),
            slider: this.getAdjacentUrlRange(onEachSide),
            last: this.getFinish(),
        };
    };

    getAdjacentUrlRange = (onEachSide) => {
        return this.paginator.getUrlRange(
            this.getCurrentPage() - onEachSide,
            this.getCurrentPage() + onEachSide
        );
    };

    getStart = () => this.paginator.getUrlRange(1, 2);

    getFinish = () =>
        this.paginator.getUrlRange(this.getLastPage() - 1, this.getLastPage());

    hasPages = () => this.paginator.getLastPage() > 1;

    getCurrentPage = () => this.paginator.getCurrentPage();

    getLastPage = () => this.paginator.getLastPage();
}

module.exports = UrlWindow;
