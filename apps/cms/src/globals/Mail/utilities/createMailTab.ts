import { Tab } from "payload";

type CreateMailTabArgs = {
    label: string;
    name: string;
    placeholders: string[];
}

function mailTabDescription(placeholders: string[]): string {
    const formattedPlaceholders = placeholders.reduce((acc, placeholder, index) => {
        return `${acc}${index === 0 ? '' : ', '}{{${placeholder}}}`;
    }, "");

    return `Gebruik de volgende placeholders om dynamische waarden in te voegen: ${formattedPlaceholders}`;
}

export const createMailTab = ({ label, name, placeholders }: CreateMailTabArgs): Tab => ({
    name,
    label,
    fields: [
        {
            name: 'subject',
            label: 'Onderwerp',
            type: 'text',
            admin: {
                description: mailTabDescription(placeholders),
            },
        },
        {
            name: 'content',
            label: 'Inhoud',
            type: 'richText',
            admin: {
                description: mailTabDescription(placeholders),
            },
        },
    ]
})









