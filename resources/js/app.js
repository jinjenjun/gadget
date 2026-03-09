import '../css/app.css';
import './bootstrap';
import ElementPlus, { ElNotification } from 'element-plus'
import 'element-plus/dist/index.css';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createApp, h } from 'vue';
import { ZiggyVue } from '../../vendor/tightenco/ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue'),
        ),
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) })

        app.use(plugin)
        app.use(ElementPlus)
        app.use(ZiggyVue)

        window.ElNotification = ElNotification
        app.mount(el)
    },
    progress: {
        color: '#4B5563',
    },
});
