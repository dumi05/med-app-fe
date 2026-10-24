export function delegationLink(token: string, origin: string = window.location.origin): string {
    return `${origin}/delegation/${encodeURIComponent(token)}`;
}