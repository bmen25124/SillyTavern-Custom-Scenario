declare global {
    interface SillyTavernContext {
        name1: string;
        // Add other properties as needed
    }

    const SillyTavern: {
        getContext(): SillyTavernContext;
        // Add other methods as needed
    };
}

export {};