package com.schleim.chronos;
import android.app.Activity;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
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

public class MainActivity extends Activity implements SensorEventListener {
  WebView web;
  SensorManager sensors;
  Sensor rotation;
  Sensor gravity;
  Sensor accel;
  long lastTiltMs;
  final float[] rotMatrix = new float[9];
  final float[] orient = new float[3];

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

    @JavascriptInterface
    public void startTilt() {
      runOnUiThread(new Runnable() {
        public void run() { listenSensors(true); }
      });
    }

    @JavascriptInterface
    public void setDim(final float brightness) {
      runOnUiThread(new Runnable() {
        public void run() {
          WindowManager.LayoutParams lp = getWindow().getAttributes();
          float b = brightness;
          if (b < 0.04f) b = 0.04f;
          if (b > 1f) b = 1f;
          lp.screenBrightness = b;
          getWindow().setAttributes(lp);
        }
      });
    }

    @JavascriptInterface
    public void keepAwake(final boolean on) {
      runOnUiThread(new Runnable() {
        public void run() {
          if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
      });
    }
  }

  void listenSensors(boolean on) {
    if (sensors == null) return;
    sensors.unregisterListener(this);
    if (!on) return;
    int rate = SensorManager.SENSOR_DELAY_GAME;
    if (rotation != null) sensors.registerListener(this, rotation, rate);
    else if (gravity != null) sensors.registerListener(this, gravity, rate);
    else if (accel != null) sensors.registerListener(this, accel, rate);
  }

  @Override public void onSensorChanged(SensorEvent ev) {
    long now = android.os.SystemClock.uptimeMillis();
    if (now - lastTiltMs < 32) return;
    lastTiltMs = now;
    float x = 0, y = 0;
    if (ev.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
      SensorManager.getRotationMatrixFromVector(rotMatrix, ev.values);
      SensorManager.getOrientation(rotMatrix, orient);
      x = (float) (orient[2] / 0.5);
      y = (float) ((orient[1] + 0.6) / 0.7);
    } else {
      x = ev.values[0] / 7f;
      y = -ev.values[2] / 7f;
    }
    if (x > 1) x = 1; if (x < -1) x = -1;
    if (y > 1) y = 1; if (y < -1) y = -1;
    if (web == null) return;
    final float fx = x, fy = y;
    web.post(new Runnable() {
      public void run() {
        web.evaluateJavascript("window.ChronosGfx&&ChronosGfx.setTilt(" + fx + "," + fy + ",true)", null);
      }
    });
  }

  @Override public void onAccuracyChanged(Sensor s, int a) {}

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    if (Build.VERSION.SDK_INT >= 28) {
      getWindow().getAttributes().layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    }
    sensors = (SensorManager) getSystemService(SENSOR_SERVICE);
    if (sensors != null) {
      rotation = sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
      gravity = sensors.getDefaultSensor(Sensor.TYPE_GRAVITY);
      accel = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
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
    listenSensors(false);
    web.onPause();
  }

  @Override protected void onResume() {
    super.onResume();
    listenSensors(true);
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
