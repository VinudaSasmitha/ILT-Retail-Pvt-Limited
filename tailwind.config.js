tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                montserrat: ["Montserrat", "sans-serif"],
                jakarta: ["Plus Jakarta Sans", "sans-serif"]
            },
            colors: {
                surface: "#11131d",
                surfaceLow: "#191b26",
                surfaceContainer: "#1d1f2a",
                surfaceHigh: "#272935",
                surfaceHighest: "#323440",
                primary: "#ffb4ac",
                primaryContainer: "#e61c24",
                secondary: "#fff3d2",
                secondaryContainer: "#fdd400",
                tertiary: "#bec6e2",
                outline: "#5d3f3c"
            },
            boxShadow: {
                premium: "0 15px 40px rgba(0,0,0,0.35)",
                red: "0 10px 30px rgba(230,28,36,0.35)",
                yellow: "0 10px 30px rgba(253,212,0,0.25)"
            }
        }
    }
};
