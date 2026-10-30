export function downloadBlob(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function filenameFrom(contentDisposition: string | null, fallback: string): string {
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition ?? '');
    const name = match?.[1].trim().replace(/[\\/]/g, '_') ?? '';
    return name === '' || /^\.+$/.test(name) ? fallback : name;
}