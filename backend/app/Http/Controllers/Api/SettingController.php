<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('group');
        return response()->json($settings);
    }

    /**
     * A whitelisted subset of settings safe to expose to guests (used by the
     * marketing site for site name, SEO metadata and social links).
     */
    public function public()
    {
        $keys = [
            'site_name', 'site_tagline', 'site_description', 'logo', 'favicon',
            'primary_color', 'secondary_color', 'currency', 'default_locale',
            'contact_email', 'contact_phone', 'social_facebook', 'social_twitter',
            'social_linkedin', 'social_instagram', 'seo_title', 'seo_description',
            'seo_keywords',
        ];

        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');

        return response()->json(['settings' => $settings]);
    }

    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();
        return response()->json($setting);
    }

    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required',
        ]);

        $setting = Setting::set($key, $validated['value']);
        return response()->json(['setting' => $setting, 'message' => 'Setting updated successfully']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
