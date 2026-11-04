export interface News {
    id: number;
    title: string;
    body: string;
    authorFirstName: string;
    authorLastName: string;
    createdAt: string;
    expiresAt: string;
    automatic: boolean;
}

export interface CreateNewsRequest {
    title: string;
    body: string;
    expiresAt: string;
}

export const MAX_NEWS_TITLE = 120;
export const MAX_NEWS_BODY = 2000;
export const MAX_NEWS_DAYS = 365;