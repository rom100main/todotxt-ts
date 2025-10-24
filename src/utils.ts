export class DateUtils {
    static parseDate(dateStr: `${string}-${string}-${string}`): Date;
    static parseDate(dateStr: string): Date | undefined;
    static parseDate(dateStr: string): Date | undefined {
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const [, year, month, day] = match;
            // Create date at midnight UTC to avoid timezone issues
            return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
        return undefined;
    }

    static isDate(token: string): token is `${string}-${string}-${string}` {
        return /^\d{4}-\d{2}-\d{2}$/.test(token);
    }

    static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}

export class ListUtils {
    static parseList(value: string): string[] {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    static serializeList(items: string[]): string {
        return items.join(",");
    }
}
