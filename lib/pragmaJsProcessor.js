const regex = /^\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm; // function declaration
const func_USED = new Map();


// JS Pragma processor functions
function preprocessPragmaJs(sourceText, filename) {
    // console.log('CONDIN', sourceText.includes('.pragma library'))
    let cleanedText = sourceText
    if (sourceText.includes('.pragma library')) {
        // Comment out the pragma line for linting
        cleanedText = sourceText.replace(/\.pragma\s+library/, '//.pragma libra');

    }
    const matches = [...cleanedText.matchAll(regex)];
    matches.forEach(match => {
        func_USED.set(match[1], 1);
    });

    // If no pragma, return original content
    return [cleanedText];
}

function postprocessPragmaJs(messages, filename) {
    return messages.flatMap((group, i) => {
        if (!Array.isArray(group) || group.length === 0) {
            return [];
        }

        return group.filter((err) => {
            if (err.ruleId === 'no-unused-vars') {
                const exist = [...func_USED.entries()]
                    .filter(([key, value]) => value > 0) // Only keep functions used at least once
                    .some(([key]) => {
                        const regex = new RegExp(`\\b${key}\\b`);
                        return regex.test(err.message); // Fix: Use err.message
                    });

                return !exist; // Remove false warnings
            }

            return true; // Keep other errors
        });
    });
}


export const pragmaJsProcessor = {
    meta: {
        name: "@justxd22/qml/pragma-js",
        version: "1.0.0",
    },
    preprocess: preprocessPragmaJs,
    postprocess: postprocessPragmaJs,
    supportsAutofix: true,
};