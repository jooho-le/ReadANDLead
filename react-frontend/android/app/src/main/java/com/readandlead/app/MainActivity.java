package com.readandlead.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    try {
      // Enable WebView remote debugging (safe in dev; no‑op on older devices)
      WebView.setWebContentsDebuggingEnabled(true);
    } catch (Throwable ignored) {}
  }
}
