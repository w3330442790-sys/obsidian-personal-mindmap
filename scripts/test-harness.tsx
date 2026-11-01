import {createRoot} from 'react-dom/client';
import {App} from '../webview/src/App';
import {registerFusionThemes} from '../src/core/theme';
import type {Host} from '../webview/src/host';
import '../webview/src/page.css';
import '../webview/src/style.css';
declare global{interface Window{__testHost:Host}}
registerFusionThemes({customThemes:[]});
createRoot(document.getElementById('root')!).render(<App host={window.__testHost}/>);
