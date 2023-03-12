import { withLeadingZero } from '../strings';

export function formatDate(date: Date, separator = '.') {
    return [withLeadingZero(date.getDate()), withLeadingZero(date.getMonth() + 1), date.getFullYear()].join(separator);
}
