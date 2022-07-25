import React from 'react';
import "antd/dist/antd.css";
import {createRoot} from 'react-dom/client';
import {MainLayout} from './page/index'
import {AppContext} from "./AppContext";

const rootDiv = document.getElementById('root');
const root = createRoot(rootDiv);
// 装载
root.render(
    <AppContext>
        <MainLayout/>
    </AppContext>
);
