import path from 'path'
import { defineConfig, ConfigEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const viteConfig = defineConfig(async (configEnv: ConfigEnv) => {
    const { mode } = configEnv
    return {
        // In dev environments, don't clear the terminal after files update
        clearScreen: mode !== 'development',
        // Use an import alias: import from '@/' anywhere instead of 'src/'
        resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
        plugins: [
            TanStackRouterVite({
                routesDirectory: path.resolve(__dirname, 'src/modules'),
                generatedRouteTree: path.resolve(
                    __dirname,
                    'src/routeTree.gen.ts'
                ),
            }),
            tailwindcss(),
        ],
    }
})

export default viteConfig
