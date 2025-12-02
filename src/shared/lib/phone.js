import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
const phoneUtil = PhoneNumberUtil.getInstance();
export function getCountryList() {
    try {
        const regions = Array.from(phoneUtil.getSupportedRegions());
        const dn = new Intl.DisplayNames(['en'], { type: 'region' });
        const arr = regions.map(r => ({ name: String(dn.of(r) || r), iso: String(r), code: `+${phoneUtil.getCountryCodeForRegion(r)}` }));
        arr.sort((a, b) => a.name.localeCompare(b.name));
        return arr;
    }
    catch (e) {
        console.warn('getCountryList failed', e);
        return [];
    }
}
export function formatToE164(localNumber, region) {
    try {
        const parsed = phoneUtil.parse(localNumber, region);
        return phoneUtil.format(parsed, PhoneNumberFormat.E164);
    }
    catch (e) {
        return null;
    }
}
export function isValidNumberForRegion(localNumber, region) {
    try {
        const parsed = phoneUtil.parse(localNumber, region);
        return phoneUtil.isValidNumberForRegion(parsed, region);
    }
    catch (e) {
        return false;
    }
}
export function isE164(phone) {
    return /^\+\d{8,15}$/.test(phone);
}
export default phoneUtil;
