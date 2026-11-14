import { registerHooks } from 'node:module';

// Node-only tests replace native configuration; no mocked code enters the app.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-constants') {
      return { url: new URL('./expo-constants-stub.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === 'react-native') {
      return { url: new URL('./react-native-stub.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === 'expo-file-system') {
      return { url: new URL('./expo-file-system-stub.mjs', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
