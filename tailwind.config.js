import forms from '@tailwindcss/forms';

export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Noto Serif TC', 'playfair', 'URWDIN'],
            },
        },
    },

    plugins: [
        forms,
        function ({ addComponents }) {
            addComponents({
                '.text-page-title': {
                    '@apply text-xl md:text-[32px] lg:text-[40px] font-bold break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-page-subtitle': {
                    '@apply text-xs font-bold md:text-[18px] lg:text-xl break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-page-description': {
                    '@apply text-base md:text-2xl lg:text-4xl font-bold break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-card-title': {
                    '@apply text-sm font-bold md:text-[18px] lg:text-xl break-all break-words whitespace-normal leading-snug':
                        {},
                },
                '.text-card-description': {
                    '@apply text-xs lg:text-[18px] break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-row-title': {
                    '@apply text-[18px] font-bold md:text-xl break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-column-title': {
                    '@apply font-bold text-[18px] md:text-xl lg:text-2xl break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-button-icon': {
                    '@apply text-sm md:text-[18px] lg:text-2xl break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-auction-title': {
                    '@apply text-[18px] md:text-[24px] lg:text-[28px] font-bold break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
                '.text-auction-description': {
                    '@apply text-[18px] md:text-[18px] lg:text-[18px] font-bold break-all break-words whitespace-normal leading-[1.8]':
                        {},
                },
            });
        },
    ],
};
