package com.jouspace.app;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Map;

/**
 * Native Capacitor bridge for the Android RECORD_AUDIO permission.
 *
 * The speech-recognition plugin's checkPermissions/requestPermissions are not
 * implemented on Android, and WebView getUserMedia does not persist a grant to
 * the app's native RECORD_AUDIO on this device. This plugin requests the
 * permission through the real Android permission API, which is the same path
 * OS Settings uses and which persists to com.jouspace.app.
 */
@CapacitorPlugin(
    name = "MicPermission",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class MicPermissionPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Map<String, PermissionState> states = getPermissionStates();
        JSObject ret = new JSObject();
        PermissionState mic = states.get("microphone");
        ret.put("microphone", mic != null ? mic.toString() : PermissionState.DENIED.toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        requestPermissionForAlias("microphone", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        Map<String, PermissionState> states = getPermissionStates();
        JSObject ret = new JSObject();
        PermissionState mic = states.get("microphone");
        ret.put("microphone", mic != null ? mic.toString() : PermissionState.DENIED.toString());
        call.resolve(ret);
    }
}