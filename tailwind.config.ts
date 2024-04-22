import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./content/**/*.{js,ts,jsx,tsx,mdx}",
        "./mdx-components.tsx",
    ],
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        h2: {
                            'font-size': '2.25rem',
                            'line-height': '2.5rem',
                            'font-weight': '700',
                        },
                        h3: {
                            'font-size': '1.875rem',
                            'line-height': '2.25rem',
                            'font-weight': '700',
                        }
                    }
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            animation: {
                flip: "flip 3s infinite steps(2, end)",
                rotate: "rotate 1.5s linear infinite both",
                clickyclicky: "clickyclicky 1.25s linear infinite",
            },
            keyframes: {
                clickyclicky: {
                    "0%, 15%": {
                        transform: "translateY(0)",
                    },
                    "20%": {
                        transform: "translateY(1.5px)",
                    },
                    "25%, 30%": {
                        transform: "translateY(0)",
                    },
                    "35%": {
                        transform: "translateY(1.5px)",
                    },
                    "40%, 100%": {
                        transform: "translateY(0)",
                    },
                },
                flip: {
                    to: {
                        transform: "rotate(360deg)",
                    },
                },
                rotate: {
                    to: {
                        transform: "rotate(90deg)",
                    },
                },
            },
        },
    },
    plugins: [require("@tailwindcss/typography"), require("daisyui")],
    daisyui: {
        themes: [
            {
                light: {
                    "color-scheme": "light",
                    "primary": "#47d18c",
                    "secondary": "#5bc0d7",
                    "accent": "#e5e619",
                    "neutral": "#1a1a1a",
                    "base-100": "#FFFFFF",
                    "base-content": "#161616",
                    "info": "#4AA8C0",
                    "success": "#823290",
                    "warning": "#EE8133",
                    "error": "#E93F33",
                },
                dark: {
                    "color-scheme": "dark",
                    "primary": "#00e599",
                    "secondary": "#ade0eb",
                    "accent": "#f0f075",
                    "neutral": "#1a1a1a",
                    "neutral-content": "#f9f7fd",
                    "base-100": "#000000",
                    "base-200": "#333333",
                    "base-content": "#f9f7fd",
                    "info": "#53c0f3",
                    "info-content": "#201047",
                    "success": "#71ead2",
                    "success-content": "#201047",
                    "warning": "#eace6c",
                    "warning-content": "#201047",
                    "error": "#ec8c78",
                    "error-content": "#201047",
                },
            },
        ],
        darkTheme: "dark",
    },
};
export default config;
