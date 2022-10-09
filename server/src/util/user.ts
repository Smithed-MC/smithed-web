export function sanitizeDisplayName(rawDisplayName: any) {
    return rawDisplayName.toLowerCase().replaceAll(' ', '-').replaceAll(/(\s+|\[|\]|{|}|\||\\|"|%|~|#|<|>|\?)/g, '');
}
