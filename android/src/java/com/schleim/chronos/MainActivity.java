package com.schleim.chronos;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  WebView web;

  public class Bridge {
    @JavascriptInterface
    public void vibrate(int ms) {
      Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
      if (v == null || ms <= 0) return;
      if (Build.VERSION.SDK_INT >= 26) {
        v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
      } else {
        v.vibrate(ms);
      }
    }
  }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    if (Build.VERSION.SDK_INT >= 28) {
      getWindow().getAttributes().layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    }
    web = new WebView(this);
    web.setBackgroundColor(0xFF080604);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowFileAccessFromFileURLs(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(true);
    s.setSupportZoom(false);
    s.setBuiltInZoomControls(false);
    s.setDisplayZoomControls(false);
    web.addJavascriptInterface(new Bridge(), "ChronosNative");
    web.setWebViewClient(new WebViewClient());
    setContentView(web);
    hideBars();
    if (b != null) web.restoreState(b);
    else web.loadUrl("file:///android_asset/www/index.html");
  }

  void hideBars() {
    web.setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      | View.SYSTEM_UI_FLAG_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    );
  }

  @Override public void onWindowFocusChanged(boolean f) {
    super.onWindowFocusChanged(f);
    if (f) hideBars();
  }

  @Override protected void onPause() {
    super.onPause();
    web.onPause();
  }

  @Override protected void onResume() {
    super.onResume();
    web.onResume();
  }

  @Override protected void onSaveInstanceState(Bundle o) {
    super.onSaveInstanceState(o);
    web.saveState(o);
  }

  @Override public void onBackPressed() {
    web.evaluateJavascript("window.goBack&&window.goBack()", new android.webkit.ValueCallback<String>() {
      public void onReceiveValue(String v) {
        if (!"true".equals(v)) finish();
      }
    });
  }
}
