package com.jouspace.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MicPermissionPlugin.class);
        super.onCreate(savedInstanceState);

        // Native-feel WebView: disable the Android overscroll glow / edge
        // rubber-band and hide scrollbar thumbs so the app scrolls like a
        // native view instead of a web page (see ISSUE 3 plan).
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
            getBridge().getWebView().setVerticalScrollBarEnabled(false);
            getBridge().getWebView().setHorizontalScrollBarEnabled(false);
        }
    }
}