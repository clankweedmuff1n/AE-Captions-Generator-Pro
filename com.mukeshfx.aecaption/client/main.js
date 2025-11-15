'use strict';
// some unnecessary functions/variables were removed, but code is very bad. Need to fix naming after deobfuscation and refactor core logic
var csInterface;
var progressTimer = null;
var isProcessing = false;
let historyStack = [];

window.addEventListener('DOMContentLoaded', function () {
    csInterface = new CSInterface();
    loadExtendScriptFiles(checkLicenseOnStartup);
    updateUserTierBadge();
    updateUserTierStatusLine();
});

function loadExtendScriptFiles(_0x2f768c) {
    var _0x3e98e4 = csInterface.getSystemPath(SystemPath.EXTENSION);
    var _0xded2a6 = _0x3e98e4 + "/host/json2.js";
    var _0x81617e = _0x3e98e4 + "/host/main.jsx";

    function _0x1f09f3(_0x13f508, _0x551e85) {
        const _0xfd5af = "try {  $.evalFile(\"" + _0x13f508 + "\");" + "  \"OK\"" + "} catch (e) {" + "  \"ERR::\" + e.toString();" + '}';
        csInterface.evalScript(_0xfd5af, function (_0x36d016) {
            if (_0x36d016 && _0x36d016.indexOf("ERR::") === 0x0) {
                showCustomAlert("Failed to load script: " + _0x36d016.substring(0x5));
            } else if (_0x551e85) {
                _0x551e85();
            }
        });
    }

    _0x1f09f3(_0xded2a6, function () {
        _0x1f09f3(_0x81617e, _0x2f768c);
    });
}

function checkLicenseOnStartup() {
    localStorage.setItem("userTier", "pro");
    updateProLocks(true);
    updateUserTierBadge();
    refreshTierUI();

    initializeMainApp();
    refreshTierUI();

    showOnboarding(false);
}

function initializeMainApp() {
    initializeUI();
    setupEventListeners();
    checkInitialSetup();
    loadSettings();
    updateExtensionInfo();
}

function initializeUI() {
    document.getElementById("progressContainer").classList.add('hidden');
    var _0x102b03 = document.getElementById("generateBtn");
    if (_0x102b03) {
        _0x102b03.textContent = "Generate Captions";
        _0x102b03.className = "btn btn-primary btn-large";
    }
    setStatusText("Ready", "statusText");
    setProgress(0x0);
}

function setupEventListeners() {
    function _0x47ad3e(_0x547569, _0x47f6bd, _0x251ca9) {
        var _0x3f9c94 = document.getElementById(_0x547569);
        if (!_0x3f9c94) {
            return;
        }
        _0x3f9c94.removeEventListener(_0x47f6bd, _0x251ca9);
        _0x3f9c94.addEventListener(_0x47f6bd, _0x251ca9);
    }

    _0x47ad3e("settingsBtn", "click", onSettingsClick);
    _0x47ad3e("backBtn", "click", onBackClick);
    _0x47ad3e('generateBtn', "click", handleGenerateClick);
    _0x47ad3e("selectFolderBtn", "click", handleSetupClick);
    _0x47ad3e("reselectBtn", "click", handleReselectClick);
    _0x47ad3e("resetSettingsBtn", "click", handleResetSettings);
    _0x47ad3e("resetAllBtn", "click", handleResetAll);
    _0x47ad3e("doBatch", "change", _0x30d044 => {
        if (_0x30d044.target.checked) {
            onBatchModeEnabled();
        }
    });
    _0x47ad3e("doTranslateToEnglish", "change", _0x3cc276 => {
        if (_0x3cc276.target.checked) {
            onTranslateToEnglishEnabled();
        }
    });
    _0x47ad3e("quickTourBtn", "click", function () {
        showOnboarding(true);
    });
    var _0x3e553d = document.getElementById("settingsForm");
    if (_0x3e553d) {
        _0x3e553d.removeEventListener("change", saveSettings);
        _0x3e553d.addEventListener("change", saveSettings);
    }
}

function showView(_0x49a137) {
    document.querySelectorAll(".view").forEach(_0x59974c => _0x59974c.classList.add("hidden"));
    const _0x11e681 = document.getElementById(_0x49a137);
    if (_0x11e681) {
        _0x11e681.classList.remove("hidden");
        if (!historyStack.length || historyStack[historyStack.length - 0x1] !== _0x49a137) {
            historyStack.push(_0x49a137);
        }
    } else {
    }
}

function checkInitialSetup() {
    csInterface.evalScript("getInitialState()", function (_0x2b173d) {
        if (_0x2b173d === "true") {
            showView("main-view");
        } else {
            showView("setup-view");
        }
        updateExtensionInfo();
    });
}

function handleSetupClick() {
    var _0x259092 = document.getElementById("selectFolderBtn");
    setButtonState(_0x259092, true, "Selecting...");
    csInterface.evalScript("selectPythonToolFolder()", function (_0xf5d284) {
        setButtonState(_0x259092, false, "Select \"Toolkit_tool\" Folder");
        if (_0xf5d284 === "success") {
            showView("main-view");
            updateExtensionInfo();
        } else {
            showCustomAlert("Toolkit failed: " + (_0xf5d284 || "Unknown error"));
        }
    });
}

function handleReselectClick() {
    showCustomConfirm("Are you sure you want to change the toolkit folder?", () => showView("setup-view"));
}

function handleGenerateClick() {
    if (isProcessing) {
        cancelProcess();
        return;
    }
    startProcess();
}

function updateUserTierBadge() {
    const _0x1e7dd4 = document.getElementById("userTierBadge");
    if (!_0x1e7dd4) {
        return;
    }
    _0x1e7dd4.textContent = "Pro User";
    _0x1e7dd4.className = "user-tier-badge pro";
}

function refreshTierUI() {
    const _0x3dea3b = document.getElementById("upgradeCard");
    if (_0x3dea3b) {
        _0x3dea3b.classList.toggle('hidden', true);
    }
}

function closeModal(_0xaa47b3 = "app-modal") {
    const _0xa18a52 = document.getElementById(_0xaa47b3);
    if (_0xa18a52) {
        _0xa18a52.remove();
    }
}

function showModal({
                       id = "app-modal",
                       title = '',
                       message = '',
                       buttons = [{
                           'text': 'OK',
                           'action': () => closeModal(id),
                           'primary': true
                       }]
                   }) {
    const _0x1da083 = document.getElementById(id);
    if (_0x1da083) {
        _0x1da083.remove();
    }
    const _0x2f7379 = document.createElement("div");
    _0x2f7379.id = id;
    _0x2f7379.className = "modal-overlay";
    const _0x3798f4 = document.createElement("div");
    _0x3798f4.className = "modal-card";
    const _0x131399 = document.createElement("div");
    _0x131399.className = "modal-title";
    _0x131399.textContent = title;
    const _0xa76b15 = document.createElement("div");
    _0xa76b15.className = "modal-body";
    _0xa76b15.innerHTML = message;
    const _0xdc4757 = document.createElement("div");
    _0xdc4757.className = "modal-actions";
    (buttons || []).forEach(_0xbcf9e8 => {
        const _0x138609 = document.createElement("button");
        _0x138609.className = "modal-btn " + (_0xbcf9e8.primary ? "primary" : _0xbcf9e8.variant || 'base');
        _0x138609.textContent = _0xbcf9e8.text;
        _0x138609.onclick = () => {
            if (_0xbcf9e8.action) {
                _0xbcf9e8.action();
            }
            closeModal(id);
        };
        _0x138609.onkeydown = _0xb9e64b => {
            if (_0xb9e64b.key === "Enter" || _0xb9e64b.key === " ") {
                _0xb9e64b.preventDefault();
                _0x138609.click();
            }
        };
        _0xdc4757.appendChild(_0x138609);
    });
    _0x3798f4.append(_0x131399, _0xa76b15, _0xdc4757);
    _0x2f7379.appendChild(_0x3798f4);
    document.body.appendChild(_0x2f7379);
}

function showCustomAlert(_0xbddfd9, _0x182526) {
    const _0x4928a7 = {
        "text": 'OK',
        "primary": false,
        "action": _0x182526
    };
    showModal({
        'title': "Notice",
        'message': _0xbddfd9,
        'buttons': [_0x4928a7]
    });
}

function showCustomConfirm(_0x57fecf, _0x43d493, _0x456d75) {
    const _0x1d0838 = {
        "text": 'OK',
        "primary": true,
        "action": _0x43d493
    };
    showModal({
        'title': "Confirm",
        'message': _0x57fecf,
        'buttons': [{
            'text': "Cancel",
            'primary': false,
            'action': _0x456d75
        }, _0x1d0838]
    });
}

function showCustomCard(_0x5621e0, _0x33d1ae, _0x39bf6d = []) {
    const _0x4a3f6e = document.getElementById("custom-card-modal");
    if (_0x4a3f6e) {
        _0x4a3f6e.remove();
    }
    const _0x40a0a0 = document.createElement('div');
    _0x40a0a0.id = "custom-card-modal";
    _0x40a0a0.style.position = "fixed";
    _0x40a0a0.style.left = '0';
    _0x40a0a0.style.top = '0';
    _0x40a0a0.style.width = "100vw";
    _0x40a0a0.style.height = '100vh';
    _0x40a0a0.style.background = "rgba(20,20,20,0.7)";
    _0x40a0a0.style.zIndex = "10000";
    _0x40a0a0.style.display = "flex";
    _0x40a0a0.style.justifyContent = "center";
    _0x40a0a0.style.alignItems = "center";
    const _0x397904 = document.createElement('div');
    _0x397904.style.background = '#242830';
    _0x397904.style.borderRadius = "16px";
    _0x397904.style.padding = "26px 28px";
    _0x397904.style.width = "380px";
    _0x397904.style.maxWidth = "92%";
    _0x397904.style.textAlign = "left";
    _0x397904.style.boxShadow = "0 6px 28px rgba(0,0,0,0.4)";
    _0x397904.style.color = "#f0f0f0";
    _0x397904.style.fontFamily = "Inter, sans-serif";
    const _0x4897ec = document.createElement('div');
    _0x4897ec.style.fontSize = "16px";
    _0x4897ec.style.fontWeight = '700';
    _0x4897ec.style.marginBottom = "10px";
    _0x4897ec.style.color = "#0d8eff";
    _0x4897ec.textContent = _0x5621e0 || '';
    _0x397904.appendChild(_0x4897ec);
    const _0x193861 = document.createElement('div');
    _0x193861.innerHTML = _0x33d1ae || '';
    _0x193861.style.fontSize = "14px";
    _0x193861.style.lineHeight = '1.6';
    _0x193861.style.color = "#ddd";
    _0x193861.style.marginBottom = "18px";
    _0x397904.appendChild(_0x193861);
    const _0x506fdd = document.createElement('div');
    _0x506fdd.style.display = "flex";
    _0x506fdd.style.justifyContent = "flex-end";
    _0x506fdd.style.gap = "10px";

    function _0x190096(_0x133f35) {
        const _0x24e15a = document.createElement("button");
        _0x24e15a.textContent = _0x133f35.text || 'OK';
        _0x24e15a.style.border = "none";
        _0x24e15a.style.borderRadius = "8px";
        _0x24e15a.style.cursor = "pointer";
        _0x24e15a.style.padding = "9px 16px";
        _0x24e15a.style.fontWeight = "600";
        _0x24e15a.style.fontSize = "13px";
        _0x24e15a.style.transition = "all 0.15s ease";
        if (_0x133f35.variant === "primary") {
            _0x24e15a.style.background = "#0d8eff";
            _0x24e15a.style.color = '#fff';
            _0x24e15a.onmouseover = () => _0x24e15a.style.background = "#0aa0ff";
            _0x24e15a.onmouseleave = () => _0x24e15a.style.background = "#0d8eff";
        } else if (_0x133f35.variant === "danger") {
            _0x24e15a.style.background = "#e53935";
            _0x24e15a.style.color = '#fff';
            _0x24e15a.onmouseover = () => _0x24e15a.style.background = "#ff4b47";
            _0x24e15a.onmouseleave = () => _0x24e15a.style.background = "#e53935";
        } else {
            _0x24e15a.style.background = "#3a3f4b";
            _0x24e15a.style.color = "#ccc";
            _0x24e15a.onmouseover = () => _0x24e15a.style.background = "#505665";
            _0x24e15a.onmouseleave = () => _0x24e15a.style.background = "#3a3f4b";
        }
        _0x24e15a.onclick = () => {
            if (!_0x133f35.keepOpen) {
                _0x40a0a0.remove();
            }
            if (_0x133f35.onClick) {
                _0x133f35.onClick();
            }
        };
        return _0x24e15a;
    }

    const _0x4f5d21 = {
        text: "Close"
    };
    (_0x39bf6d || [_0x4f5d21]).forEach(_0x381258 => _0x506fdd.appendChild(_0x190096(_0x381258)));
    _0x397904.appendChild(_0x506fdd);
    _0x40a0a0.appendChild(_0x397904);
    document.body.appendChild(_0x40a0a0);
}

function showOnboarding(_0x23bd70 = false) {
    if (!_0x23bd70 && localStorage.getItem("onboarding_shown_v1") === "true") {
        return;
    }
    let _0x4a00f2 = 0x1;

    function _0x1df910() {
        if (_0x4a00f2 === 0x1) {
            showCustomCard("Welcome to AutoCaption 🎉", "\n        <div style=\"margin-bottom:10px;\">Let's get you set up in 2 quick steps.</div>\n        <ul style=\"padding-left:18px; margin:0;\">\n          <li>➔Select your <b>Toolkit Folder</b></li>\n          <li>➔Enter your <b>License Key</b> </li>\n        </ul>\n        <div style=\"margin-top:12px;color:#9aa0a6;font-size:12px;\">You can run this guide anytime from Utilities → Quick Tour.</div>\n      ", [{
                'text': "Skip",
                'variant': "base",
                'onClick': () => localStorage.setItem("onboarding_shown_v1", "true")
            }, {
                'text': "Next (" + _0x4a00f2 + '/' + 0x2 + ')',
                'variant': 'primary',
                'keepOpen': true,
                'onClick': () => {
                    document.getElementById("custom-card-modal")?.["remove"]();
                    _0x4a00f2 = 0x2;
                    _0x1df910();
                }
            }]);
        } else {
            if (_0x4a00f2 === 0x2) {
                showCustomCard("Step 1: Select Toolkit Folder", "\n        Click <b>Utilities → Select Toolkit Folder</b> to connect the Backend.<br><br>\n      ", [{
                    'text': "Okay, Got it",
                    'variant': 'primary',
                    'onClick': () => {
                        localStorage.setItem("onboarding_shown_v1", "true");
                    }
                }]);
            }
        }
    }

    _0x1df910();
}

function showMiniTip(_0x327db2, _0x43208e, _0x4bb0b8) {
    const _0x3a4927 = "tip_" + _0x327db2 + "_seen";
    if (localStorage.getItem(_0x3a4927) === "true") {
        return;
    }
    localStorage.setItem(_0x3a4927, "true");
    const _0x1a4715 = {
        "text": "Got it",
        "variant": "primary"
    };
    showCustomCard(_0x43208e, _0x4bb0b8, [_0x1a4715, {
        'text': "Learn More",
        'variant': "base",
        'onClick': () => window.open("https://www.youtube.com/channel/UCy7KFDmtn2ziZLxH3L_ImYQ", "_blank")
    }]);
}

function onBatchModeEnabled() {
    showMiniTip("batchmode", "Batch Mode Tip 💡", "\n      Process multiple videos at once<br><br>\n      Pro users unlock full batch mode — check <b>Utilities → Get Pro</b>.\n    ");
}

function onTranslateToEnglishEnabled() {
    showMiniTip("translate", "Translate to English Tip 💡", "\n      Automatically translate captions to English for better accessibility.<br><br>\n      Pro users can enable this feature in <b>Utilities → Get Pro</b>.\n    ");
}

function updateUserTierStatusLine() {
    const _0xe159c1 = document.getElementById("userTierStatus");
    if (!_0xe159c1) {
        return;
    }
    _0xe159c1.textContent = "Pro";
    _0xe159c1.classList.remove("status-connected", "status-disconnected");
    _0xe159c1.classList.add("status-connected");
}

function onSettingsClick() {
    showView("utilities-view");
    updateUserTierStatusLine();
    updateUserTierBadge();
    refreshTierUI();
}

function onBackClick() {
    showView('main-view');
}

function handleResetSettings() {
    showCustomConfirm("Are you sure you want to reset all form settings to their defaults?", () => {
        resetFormToDefaults();
        saveSettings();
        csInterface.evalScript("resetSettingsOnly()");
        showCustomAlert("Settings have been reset.");
    });
}

function handleResetAll() {
    showCustomConfirm("WARNING: This will reset everything except your license. Are you sure?", () => {
        (async function () {
            try {
                const _0x13330a = ["licenseKey", "license_key", "license", "licenseValid", "licenseValidFlag"];
                const _0x20c91c = {};
                const _0x20c784 = {};
                const _0x124b20 = {};
                const _0x3e8310 = [];
                for (let _0xf690d = 0x0; _0xf690d < localStorage.length; _0xf690d++) {
                    const _0x4f60ea = localStorage.key(_0xf690d);
                    if (_0x4f60ea) {
                        _0x3e8310.push(_0x4f60ea);
                    }
                }
                _0x3e8310.forEach(_0x3d1126 => {
                    try {
                        if (_0x13330a.includes(_0x3d1126)) {
                            _0x20c91c[_0x3d1126] = localStorage.getItem(_0x3d1126);
                        }
                        if (_0x3d1126.indexOf("lastActiveDevice_") === 0x0 || _0x3d1126.indexOf("cooldown_until_") === 0x0) {
                            _0x20c784[_0x3d1126] = localStorage.getItem(_0x3d1126);
                        }
                        if (_0x3d1126.indexOf("freeRuns:") === 0x0 || _0x3d1126 === "total-processed" || _0x3d1126 === "last-run-time") {
                            _0x124b20[_0x3d1126] = localStorage.getItem(_0x3d1126);
                        }
                    } catch (_0x361b19) {
                    }
                });
                let _0x59367c = '';
                let _0x2684f1 = "false";
                if (typeof csInterface !== "undefined" && csInterface.evalScript) {
                    try {
                        _0x59367c = await new Promise(_0x33eab5 => csInterface.evalScript("getLicenseKey()", _0x33eab5));
                        _0x2684f1 = await new Promise(_0x3c3bc8 => csInterface.evalScript("getLicenseState()", _0x3c3bc8));
                    } catch (_0xc45ce3) {
                    }
                    if (_0x59367c && _0x59367c !== "undefined") {
                        _0x20c91c.licenseKeyFromHost = _0x59367c;
                    }
                    if (_0x2684f1 && _0x2684f1 !== "undefined") {
                        _0x20c91c.licenseValidFromHost = _0x2684f1;
                    }
                }
                const _0x377418 = {};
                for (let _0x363f77 = 0x0; _0x363f77 < localStorage.length; _0x363f77++) {
                    const _0x34c848 = localStorage.key(_0x363f77);
                    if (_0x34c848 && _0x34c848.startsWith("freeRuns:")) {
                        _0x377418[_0x34c848] = localStorage.getItem(_0x34c848);
                    }
                }
                localStorage.clear();
                for (const _0x474a51 in _0x377418) {
                    localStorage.setItem(_0x474a51, _0x377418[_0x474a51]);
                }
                Object.keys(_0x20c91c).forEach(_0x5ca9f0 => {
                    if (_0x20c91c[_0x5ca9f0] !== undefined && _0x20c91c[_0x5ca9f0] !== null) {
                        localStorage.setItem(_0x5ca9f0, _0x20c91c[_0x5ca9f0]);
                    }
                });
                Object.keys(_0x20c784).forEach(_0x5f220b => {
                    localStorage.setItem(_0x5f220b, _0x20c784[_0x5f220b]);
                });
                Object.keys(_0x124b20).forEach(_0x1f6a08 => {
                    localStorage.setItem(_0x1f6a08, _0x124b20[_0x1f6a08]);
                });
                if (typeof csInterface !== "undefined" && csInterface.evalScript) {
                    csInterface.evalScript("resetEverything()", function (_0x5a4261) {
                        const app = document.getElementById("main-app-container");
                        if (app) {
                            app.classList.add("hidden");
                        }
                        showResetBlankScreen();
                        localStorage.setItem("userTier", "pro");
                        updateProLocks(true);
                        updateUserTierBadge();
                        updateUserTierStatusLine();
                        refreshTierUI();
                    });
                }
            } catch (_0x5940cb) {
                showCustomAlert("Reset failed: " + (_0x5940cb && _0x5940cb.message ? _0x5940cb.message : String(_0x5940cb)));
            }
        })();
    });
}

function showResetBlankScreen() {
    const _0x2f8ce6 = document.getElementById("post-reset-blank");
    if (_0x2f8ce6) {
        _0x2f8ce6.remove();
    }
    const _0x298972 = document.createElement("div");
    _0x298972.id = "post-reset-blank";
    _0x298972.style.position = "absolute";
    _0x298972.style.left = '0';
    _0x298972.style.top = '0';
    _0x298972.style.right = '0';
    _0x298972.style.bottom = '0';
    _0x298972.style.display = "flex";
    _0x298972.style.alignItems = "center";
    _0x298972.style.justifyContent = "center";
    _0x298972.style.background = "#1e2127";
    const _0x38f304 = document.createElement("div");
    _0x38f304.style.background = "#242830";
    _0x38f304.style.borderRadius = "16px";
    _0x38f304.style.padding = "28px 32px";
    _0x38f304.style.width = "380px";
    _0x38f304.style.maxWidth = "92%";
    _0x38f304.style.textAlign = "center";
    _0x38f304.style.boxShadow = "0 10px 28px rgba(0,0,0,0.35)";
    _0x38f304.style.color = '#f0f0f0';
    _0x38f304.style.fontFamily = "Inter, sans-serif";
    const _0x31e9eb = document.createElement("div");
    _0x31e9eb.textContent = "Extension Reset";
    _0x31e9eb.style.fontSize = "18px";
    _0x31e9eb.style.fontWeight = "bold";
    _0x31e9eb.style.marginBottom = "8px";
    _0x31e9eb.style.color = '#0d8eff';
    const _0x3c7d4d = document.createElement("div");
    _0x3c7d4d.innerHTML = "The extension has been reset.<br/>Please <b>close</b> this panel and <b>reopen</b> it.";
    _0x3c7d4d.style.fontSize = "14px";
    _0x3c7d4d.style.opacity = "0.9";
    _0x3c7d4d.style.marginBottom = '18px';
    const _0x5667c5 = document.createElement("div");
    _0x5667c5.textContent = "Window ▸ Extensions ▸ AutoCaption Tool";
    _0x5667c5.style.fontSize = "12px";
    _0x5667c5.style.opacity = "0.85";
    _0x38f304.appendChild(_0x31e9eb);
    _0x38f304.appendChild(_0x3c7d4d);
    _0x38f304.appendChild(_0x5667c5);
    _0x298972.appendChild(_0x38f304);
    document.body.appendChild(_0x298972);
}

function startProcess() {
    isProcessing = true;
    const _0x4437a = document.getElementById("generateBtn");
    _0x4437a.innerHTML = "Processing <span class=\"loading-spinner\"></span>";
    _0x4437a.className = "btn btn-primary btn-large";
    setTimeout(() => {
        saveSettings();
        var _0x332ed5 = {
            'maxChars': parseInt(document.getElementById("maxChars").value) || 0x20,
            'maxDuration': parseFloat(document.getElementById("maxDuration").value) || 0x3,
            'gapFrames': parseInt(document.getElementById("gapFrames").value) || 0x2,
            'lineMode': document.getElementById("lineMode").value || "smart",
            'langCode': document.getElementById("langCode").value || "auto",
            'modelSize': document.getElementById("modelSize").value || "small",
            'doBatch': document.getElementById("doBatch").checked,
            'doExportSrt': document.getElementById("doExportSrt").checked,
            'doCleanup': document.getElementById("doCleanup").checked,
            'singleLayerMode': document.getElementById('singleLayerMode').checked,
            'doTranslateToEnglish': document.getElementById("doTranslateToEnglish").checked,
            'positionIndex': document.getElementById("posDropdown").value,
            'fontSize': document.getElementById('fontSizeDropdown').value
        };
        var _0x3246a9 = encodeURIComponent(JSON.stringify(_0x332ed5));

        csInterface.evalScript("runFullProcess(\"" + _0x3246a9 + "\")", () => {
            setProcessingUI(true);
            startProgressPolling();
        });
    }, 0x32);
}

function cancelProcess() {
    csInterface.evalScript("cancelCurrentProcess()", function (_0x4b528a) {
        if (_0x4b528a === "true") {
            stopProcess();
            setStatusText("Process cancelled by user", 'statusText');
        } else {
            setStatusText("Failed to send cancel signal", 'statusText');
        }
    });
}

function stopProcess() {
    isProcessing = false;
    setProcessingUI(false);
    stopProgressPolling();
}

function startProgressPolling() {
    if (progressTimer) {
        clearInterval(progressTimer);
    }
    progressTimer = setInterval(updateProgress, 0x258);
}

function stopProgressPolling() {
    if (progressTimer) {
        clearInterval(progressTimer);
    }
    progressTimer = null;
}

function updateProgress() {
    csInterface.evalScript("getProcessStatus()", function (_0x4b47dd) {
        if (_0x4b47dd === "finished") {
            handleProcessFinished();
        } else {
            if (_0x4b47dd === "error") {
                handleProcessError();
            } else {
                updateProgressDisplay();
            }
        }
    });
}

function handleProcessFinished() {
    stopProcess();
}

function handleProcessError() {
    stopProcess();
    csInterface.evalScript("getProgressMessage()", function (_0x3a0161) {
        var _0x15cbf3 = _0x3a0161 || "Process failed. Check logs for details.";
        setStatusText(_0x15cbf3, "statusText");
        showCustomAlert("Process failed: " + _0x15cbf3);
    });
}

function saveSettings() {
    try {
        localStorage.setItem("autocaption-settings", JSON.stringify({
            'maxChars': parseInt(document.getElementById("maxChars").value) || 0x20,
            'maxDuration': parseFloat(document.getElementById("maxDuration").value) || 0x3,
            'gapFrames': parseInt(document.getElementById("gapFrames").value) || 0x2,
            'lineMode': document.getElementById("lineMode").value || "smart",
            'langCode': document.getElementById("langCode").value || "auto",
            'modelSize': document.getElementById("modelSize").value || "small",
            'doBatch': document.getElementById("doBatch").checked,
            'doExportSrt': document.getElementById("doExportSrt").checked,
            'doCleanup': document.getElementById("doCleanup").checked,
            'singleLayerMode': document.getElementById('singleLayerMode').checked,
            'doTranslateToEnglish': document.getElementById("doTranslateToEnglish").checked,
            'positionIndex': document.getElementById("posDropdown").value,
            'fontSize': document.getElementById('fontSizeDropdown').value
        }));
    } catch (_0x26c74a) {
    }
}

function loadSettings() {
    try {
        var _0x150720 = localStorage.getItem("autocaption-settings");
        if (_0x150720) {
            applySettings(JSON.parse(_0x150720));
        }
    } catch (_0x528a8f) {
    }
}

function applySettings(_0x53c85c) {
    if (!_0x53c85c) {
        return;
    }
    for (var _0x261fe8 in _0x53c85c) {
        if (_0x53c85c.hasOwnProperty(_0x261fe8)) {
            var _0x154d3d = document.getElementById(_0x261fe8);
            if (_0x154d3d) {
                if (_0x154d3d.type === 'checkbox') {
                    _0x154d3d.checked = _0x53c85c[_0x261fe8];
                } else {
                    _0x154d3d.value = _0x53c85c[_0x261fe8];
                }
            }
        }
    }
}

function resetFormToDefaults() {
    document.getElementById("settingsForm").reset();
    document.getElementById("doExportSrt").checked = true;
    document.getElementById('doCleanup').checked = true;
}

function updateExtensionInfo() {
    document.getElementById("extensionVersion").textContent = window.AutoCaptionVersion.version;
    csInterface.evalScript("getInitialState()", function (_0x23bc01) {
        var _0x27ed5e = document.getElementById("backendStatus");
        _0x27ed5e.textContent = _0x23bc01 === "true" ? 'Connected' : "Not Connected";
        _0x27ed5e.className = _0x23bc01 === "true" ? "info-value status-connected" : "info-value status-disconnected";
    });
    document.getElementById("lastRunTime").textContent = localStorage.getItem("last-run-time") ? new Date(parseInt(localStorage.getItem("last-run-time"))).toLocaleString() : "Never";
    document.getElementById("totalProcessed").textContent = (localStorage.getItem('total-processed') || '0') + " videos";
}

function updateProgressDisplay() {
    csInterface.evalScript('getProgressPercent()', function (_0x1cca4f) {
        setProgress(parseFloat(_0x1cca4f) || 0x0);
    });
    csInterface.evalScript("getProgressMessage()", function (_0x37dd2f) {
        setStatusText(_0x37dd2f || "Processing...", "statusText");
    });
}

function setProgress(_0x17c2a0) {
    document.getElementById("progressBar").style.width = _0x17c2a0 + '%';
    document.getElementById('progressText').textContent = Math.round(_0x17c2a0) + '%';
}

function setProcessingUI(_0x49ff5e) {
    var _0x247100 = document.getElementById("generateBtn");
    var _0x1f9c82 = document.getElementById('settingsForm');
    var _0xf789e2 = document.getElementById("settingsBtn");
    _0x247100.disabled = _0x49ff5e;
    _0xf789e2.disabled = _0x49ff5e;
    _0x1f9c82.querySelectorAll("input, select").forEach(function (_0xeec262) {
        _0xeec262.disabled = _0x49ff5e;
    });
    if (_0x49ff5e) {
        _0x247100.textContent = "Cancel Process";
        _0x247100.className = "btn btn-danger btn-large";
        document.getElementById("progressContainer").classList.remove('hidden');
    } else {
        _0x247100.textContent = "Generate Captions";
        _0x247100.className = "btn btn-primary btn-large";
    }
}

function setStatusText(_0x882ab4, _0x57016e) {
    document.getElementById(_0x57016e).textContent = _0x882ab4 || '';
}

function setButtonState(_0x48df1d, _0x4318be, _0x14b916) {
    if (_0x48df1d) {
        _0x48df1d.disabled = _0x4318be;
        if (_0x14b916) {
            _0x48df1d.textContent = _0x14b916;
        }
    }
}

function updateProLocks(_0xb07e9a) {
    document.querySelectorAll("[data-pro]").forEach(_0x5ec992 => {
        const _0x27bd60 = _0x5ec992.tagName === "OPTION" ? _0x5ec992 : _0x5ec992.closest("input, select, button") || _0x5ec992;
        if (!_0x27bd60) {
            return;
        }
        _0x27bd60.disabled = !_0xb07e9a;
        if (!_0xb07e9a) {
            _0x27bd60.title = "Pro feature — upgrade on Gumroad";
        } else {
            _0x27bd60.removeAttribute('title');
        }
    });
    const _0x3ef7d9 = document.getElementById("modelSize");
    if (_0x3ef7d9) {
        if (!_0xb07e9a && /medium|large/i.test(_0x3ef7d9.value)) {
            _0x3ef7d9.value = "small";
        }
    }
}
