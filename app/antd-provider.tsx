'use client';

import React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
    const cache = React.useMemo(() => createCache(), []);

    useServerInsertedHTML(() => (
        <style
            id="antd-css"
            dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }}
        />
    ));

    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                locale={zhCN}
                theme={{
                    token: {
                        colorPrimary: '#1677ff',
                        borderRadius: 8,
                        fontFamily: 'var(--app-font-sans)',
                    },
                }}
            >
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </StyleProvider>
    );
}
