export function getCSSCustomProp(
    element = document.documentElement,
    propKey: string,
    castAs?: 'number' | 'int' | 'boolean' | 'string',
) {
    let response = getComputedStyle(element).getPropertyValue(propKey);

    // Tidy up the string if there's something to work with
    if (response.length) {
        response = response.replace(/'|"/g, '').trim();
    }

    // Convert the response into a whatever type we wanted
    switch (castAs) {
        case 'int':
            return parseInt(response, 10);
        case 'number':
            return parseFloat(response);
        case 'boolean':
            return response === 'true' || response === '1';
        default:
            return response;
    }
}
