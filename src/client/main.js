'use strict';

var csInterface;
var progressTimer = null;
var isProcessing = false;
var activationInFlight = false;
let historyStack = [];
let freeVerifyInFlight = false;

function loadFreeVerifyMeta() {
    return {
        'last': parseInt(localStorage.getItem("lastFreeVerifyAt") || '0', 0xa),
        'next': parseInt(localStorage.getItem("nextFreeVerifyAt") || '0', 0xa),
        'ver': localStorage.getItem('freeVerifyVersion') || ''
    };
}

function saveFreeVerifyMeta({
                                last: _0x4d7652,
                                next: _0x2dded6,
                                ver: _0x1b830f
                            }) {
    if (_0x4d7652) {
        localStorage.setItem("lastFreeVerifyAt", String(_0x4d7652));
    }
    if (_0x2dded6) {
        localStorage.setItem("nextFreeVerifyAt", String(_0x2dded6));
    }
    if (_0x1b830f !== undefined) {
        localStorage.setItem("freeVerifyVersion", _0x1b830f);
    }
}

function computeNextFreeVerifyAt(_0x5dfb6e = Date.now()) {
    const _0xa9258 = Math.floor(Math.random() * 86400000);
    return _0x5dfb6e + 1296000000 + _0xa9258;
}

function shouldVerifyFreeOnStartup(_0x375f12) {
    const {
        next: _0x414a1f,
        ver: _0x24d5d4
    } = {
        'last': parseInt(localStorage.getItem("lastFreeVerifyAt") || '0', 0xa),
        'next': parseInt(localStorage.getItem("nextFreeVerifyAt") || '0', 0xa),
        'ver': localStorage.getItem('freeVerifyVersion') || ''
    };
    const _0x10ed69 = _0x24d5d4 && _0x24d5d4 !== _0x375f12;
    const _0x1d16e8 = Date.now() >= (_0x414a1f || 0x0);
    return _0x10ed69 || _0x1d16e8;
}

function scheduleFreeVerifyBackground(_0x4a0a34) {
    if (freeVerifyInFlight) {
        return;
    }
    freeVerifyInFlight = true;
    const _0x4e1206 = 0x7530 + Math.floor(Math.random() * 0xea60);
    setTimeout(async () => {
        try {
            const _0xca9958 = Date.now();
            saveFreeVerifyMeta({
                'last': _0xca9958,
                'next': computeNextFreeVerifyAt(_0xca9958),
                'ver': _0x4a0a34
            });
        } catch (_0x585d92) {
            const _0x450034 = Date.now();
            saveFreeVerifyMeta({
                'next': _0x450034 + Math.floor(86400000 * (0.5 + Math.random()))
            });
        } finally {
            freeVerifyInFlight = false;
        }
    }, _0x4e1206);
}

function getCooldownKey(_0x2450ad) {
    const _0x11fd78 = simpleHash(_0x2450ad + "lg_c16J0-Vp21D27hbI4XQ==");
    return "cooldown_until_" + _0x11fd78;
}

function setCooldown(_0x58ed28, _0x12e9e9 = 0x3) {
    if (!_0x58ed28) {
        return;
    }
    const _0x51cefa = Date.now() + _0x12e9e9 * 0x3c * 0x3c * 0x3e8;
    localStorage.setItem(getCooldownKey(_0x58ed28), String(_0x51cefa));
}

function clearCooldown(_0xfd74fe) {
    if (!_0xfd74fe) {
        return;
    }
    localStorage.removeItem(getCooldownKey(_0xfd74fe));
}

function isInCooldown(_0x476881) {
    const _0x3fd1ca = localStorage.getItem(getCooldownKey(_0x476881));
    const _0x5c9cbf = _0x3fd1ca ? parseInt(_0x3fd1ca, 0xa) : 0x0;
    return _0x5c9cbf > Date.now();
}

function cooldownRemaining(_0xdd34ae) {
    const _0x90a581 = localStorage.getItem(getCooldownKey(_0xdd34ae));
    const _0x26152e = _0x90a581 ? parseInt(_0x90a581, 0xa) : 0x0;
    return Math.max(0x0, _0x26152e - Date.now());
}

function formatDuration(_0x17213d) {
    const _0x367c02 = Math.ceil(_0x17213d / 0x3e8);
    if (_0x367c02 <= 0x3c) {
        return _0x367c02 + 's';
    }
    const _0x69d04b = Math.floor(_0x367c02 / 0x3c);
    const _0x9d8d01 = _0x367c02 % 0x3c;
    if (_0x69d04b < 0x3c) {
        return _0x69d04b + "m " + _0x9d8d01 + 's';
    }
    const _0x10423f = Math.floor(_0x69d04b / 0x3c);
    const _0x2e4f0e = _0x69d04b % 0x3c;
    return _0x10423f + "h " + _0x2e4f0e + 'm';
}

async function apiPost(_0x20bbbe, _0x2b17a2) {
    const _0x5b0c05 = await fetch("https://autocaption-license-isq0wsikb-mukeshs-projects-292d3435.vercel.app" + _0x20bbbe, {
        'method': "POST",
        'headers': {
            'Content-Type': "application/json"
        },
        'body': JSON.stringify(_0x2b17a2 || {})
    });
    const _0xc73faa = await _0x5b0c05.json()["catch"](() => ({}));
    if (!_0x5b0c05.ok || _0xc73faa.success === false) {
        const _0xc31f88 = _0xc73faa.message || "API error " + _0x5b0c05.status;
        throw new Error(_0xc31f88);
    }
    return _0xc73faa;
}

async function serverVerifyNoInc(_0x565db5, _0x1b5460) {
    const _0x98a733 = {
        "license_key": _0x565db5,
        "product_id": _0x1b5460
    };
    return apiPost('/api/verify', _0x98a733);
}

async function serverHardTakeover(_0x5878df, _0x644049) {
    const _0x350efa = {
        "license_key": _0x5878df,
        "product_id": _0x644049
    };
    return apiPost("/api/takeover", _0x350efa);
}

async function serverCheckBinding(_0x2b38d1, _0x179d97, _0xab5740) {
    const _0xc2f582 = {
        "license_key": _0x2b38d1,
        "product_id": _0x179d97,
        device_id: _0xab5740
    };
    return apiPost("/api/binding-check", _0xc2f582);
}

async function serverBind(_0x49d017, _0x346b35, _0x52ef7a) {
    const _0xf641eb = {
        license_key: _0x49d017,
        "product_id": _0x346b35,
        "device_id": _0x52ef7a
    };
    return apiPost('/api/bind', _0xf641eb);
}

async function serverHeartbeat(_0x4ec22a, _0x12ad2e, _0xdbbed0) {
    const _0x13e6a6 = {
        "license_key": _0x4ec22a,
        product_id: _0x12ad2e,
        "device_id": _0xdbbed0
    };
    return apiPost("/api/heartbeat", _0x13e6a6);
}

function simpleHash(_0x248434) {
    var _0x98d7f9 = 0x0;
    var _0x126489;
    var _0x35be7b;
    if (_0x248434.length === 0x0) {
        return _0x98d7f9;
    }
    for (_0x126489 = 0x0; _0x126489 < _0x248434.length; _0x126489++) {
        _0x35be7b = _0x248434.charCodeAt(_0x126489);
        _0x98d7f9 = (_0x98d7f9 << 0x5) - _0x98d7f9 + _0x35be7b;
        _0x98d7f9 |= 0x0;
    }
    return Math.abs(_0x98d7f9);
}

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
    csInterface.evalScript("getLicenseState()", function (_0xdc8f50) {
        if (_0xdc8f50 === 'true') {
            ensureDeviceBinding(function (_0x276cde) {
                if (!_0x276cde) {
                    return;
                }
                var _0x410bd4 = localStorage.getItem("userTier") || "free";
                updateProLocks(_0x410bd4 === "pro");
                updateUserTierBadge();
                refreshTierUI();
                csInterface.evalScript("getLicenseKey()", function (_0xe222e7) {
                    if (_0xe222e7 && _0xe222e7.length > 0xa) {
                        reVerifyLicenseQuietly(_0xe222e7);
                    }
                });
                activateApp();
                startLicenseHeartbeat();
                showOnboarding(false);
            });
        } else {
            const _0x4e17d4 = window.AutoCaptionVersion?.["build"] || "dev";
            const _0x326d2b = shouldVerifyFreeOnStartup(_0x4e17d4);
            if (_0x326d2b) {
                scheduleFreeVerifyBackground(_0x4e17d4);
            }
            localStorage.setItem("userTier", "free");
            updateProLocks(false);
            updateUserTierBadge();
            refreshTierUI();
            showView("activation-view");
            setupActivationListeners();
            showOnboarding(false);
        }
    });
}

function setupActivationListeners() {
    var _0x1e19a9 = document.getElementById("verifyLicenseBtn");
    if (_0x1e19a9) {
        _0x1e19a9.removeEventListener("click", handleVerifyLicense);
        _0x1e19a9.addEventListener("click", handleVerifyLicense);
    }
    var _0x6e53be = document.getElementById("buyLink");
    if (_0x6e53be) {
        _0x6e53be.removeEventListener("click", openBuyLink);
        _0x6e53be.addEventListener("click", openBuyLink);
    }
}

function activateApp() {
    var appContainer = document.getElementById("main-app-container");
    var _0x357c9c = document.getElementById("activation-view");
    if (appContainer && _0x357c9c) {
        appContainer.classList.remove("hidden");
        _0x357c9c.classList.add('hidden');
    }
    initializeMainApp();
    refreshTierUI();
}

async function handleVerifyLicense() {
    if (activationInFlight) {
        return;
    }
    activationInFlight = true;
    const _0x1fdfe5 = document.getElementById("verifyLicenseBtn");
    const _0x1f2a71 = (document.getElementById("licenseKeyInput").value || '').trim();
    const _0xb596bc = localStorage.getItem("userTier") || "free";
    setButtonState(_0x1fdfe5, true, "Verifying...");
    setStatusText('', "licenseStatus");
    try {
        if (!_0x1f2a71) {
            throw new Error("Please enter a license key.");
        }
        if (isInCooldown(_0x1f2a71)) {
            const _0x322ce6 = cooldownRemaining(_0x1f2a71);
            setButtonState(_0x1fdfe5, false, "Activate");
            setStatusText("Please wait " + formatDuration(_0x322ce6) + " before retrying.", "licenseStatus");
            activationInFlight = false;
            return;
        }
        const _0x34aa00 = await new Promise(_0x38541d => csInterface.evalScript("getDeviceID()", _0x38541d));
        if (!_0x34aa00 || _0x34aa00 === "error-creating-id") {
            throw new Error("Could not generate device ID.");
        }
        setStatusText("Verifying license...", "licenseStatus");
        const _0x4bec53 = await serverVerifyNoInc(_0x1f2a71, "lg_c16J0-Vp21D27hbI4XQ==");
        if (_0x4bec53.purchase.refunded || _0x4bec53.purchase.chargebacked) {
            throw new Error("License refunded or disputed.");
        }
        let _0x15f740 = await serverCheckBinding(_0x1f2a71, "lg_c16J0-Vp21D27hbI4XQ==", _0x34aa00);
        if (!_0x15f740.bound) {
            await serverBind(_0x1f2a71, "lg_c16J0-Vp21D27hbI4XQ==", _0x34aa00);
            setStatusText("Activated — bound to this device.", "licenseStatus");
        } else if (!_0x15f740.same) {
            await new Promise((_0x1b9af1, _0x255bbb) => {
                showCustomConfirm("This license is active on another device.<br><br>The other device will be logged out automatically.<br><br>Do you want to continue?", () => _0x1b9af1(true), () => _0x255bbb(new Error("Activation cancelled.")));
            });
            await serverBind(_0x1f2a71, "lg_c16J0-Vp21D27hbI4XQ==", _0x34aa00);
            setStatusText("Taken over — previous device will be logged out soon.", "licenseStatus");
        }
        const _0x3f2257 = detectTier(_0x4bec53.purchase);
        localStorage.setItem("userTier", _0x3f2257);
        updateProLocks(_0x3f2257 === "pro");
        updateUserTierBadge();
        updateUserTierStatusLine();
        refreshTierUI();
        setLicenseStatusInfo("Active", true);
        csInterface.evalScript("saveLicenseState(\"true\", \"" + _0x1f2a71 + "\")");
        clearCooldown(_0x1f2a71);
        if (_0xb596bc !== "pro" && _0x3f2257 === "pro") {
            showThankYouPro();
        }
        const _0x4d0986 = simpleHash(_0x1f2a71 + "lg_c16J0-Vp21D27hbI4XQ==");
        const _0x109460 = "lastActiveDevice_" + _0x4d0986;
        localStorage.setItem(_0x109460, _0x34aa00);
        startLicenseHeartbeat();
        setButtonState(_0x1fdfe5, true, "Success!");
        setTimeout(activateApp, 0x258);
    } catch (_0x2b5e44) {
        setStatusText(_0x2b5e44.message || String(_0x2b5e44), "licenseStatus");
        setButtonState(_0x1fdfe5, false, "Activate");
        csInterface.evalScript("saveLicenseState(\"false\", \"\")");
    } finally {
        activationInFlight = false;
    }
}

function confirmDeviceSwitch(_0x4f94c2, _0x41ff12, _0x1de1e3) {
    showCustomConfirm("This license is already active on another device.\n\nActivating here will log out the other device (locally).\n\nContinue?", () => {
        activateNewDevice(_0x4f94c2, _0x41ff12, _0x1de1e3, true);
    }, () => {
        setStatusText("Activation cancelled", "licenseStatus");
        setButtonState(document.getElementById("verifyLicenseBtn"), false, "Activate");
        activationInFlight = false;
    });
}

function activateNewDevice(_0x2ff577, _0xc7c537, _0x3d5e4b, _0x369809) {
    var _0x338225 = "lastActiveDevice_" + simpleHash(_0x2ff577 + "lg_c16J0-Vp21D27hbI4XQ==");
    var _0x5d3202 = localStorage.getItem(_0x338225);
    if (_0x5d3202 === _0xc7c537) {
        completeActivation(_0x3d5e4b, _0xc7c537, _0x2ff577);
        activationInFlight = false;
        return;
    }
    if (!_0x369809) {
        completeActivation(_0x3d5e4b, _0xc7c537, _0x2ff577);
        activationInFlight = false;
        return;
    }
    const _0x5e8573 = {
        "increment": true
    };
    gumroadVerify(_0x2ff577, _0x5e8573, function (_0x56b857) {
        if (_0x56b857.success) {
            completeActivation(_0x56b857, _0xc7c537, _0x2ff577);
        } else {
            handleActivationError(_0x56b857);
        }
        activationInFlight = false;
    }, function (_0x1d3c65) {
        handleNetworkError(_0x1d3c65);
        activationInFlight = false;
    });
}

function completeActivation(_0x3d9158, _0x24e141, _0x3b25d3) {
    setStatusText("Activated — Pro features unlocked on this device.", "licenseStatus");
    csInterface.evalScript("saveLicenseState(\"true\", \"" + _0x3b25d3 + "\")");
    var _0x24f2be = detectTier(_0x3d9158.purchase);
    localStorage.setItem("userTier", _0x24f2be);
    var _0x504768 = simpleHash(_0x3b25d3 + "lg_c16J0-Vp21D27hbI4XQ==");
    localStorage.setItem('lastActiveDevice_' + _0x504768, _0x24e141);
    updateProLocks(_0x24f2be === "pro");
    updateUserTierBadge();
    updateUserTierStatusLine();
    setLicenseStatusInfo("Active", true);
    setButtonState(document.getElementById("verifyLicenseBtn"), true, "Success!");
    setTimeout(activateApp, 0x320);
}

function handleActivationError(_0x1827c4) {
    var _0x23601c = _0x1827c4 && _0x1827c4.message || "The key is not valid for this product.";
    if (_0x1827c4 && _0x1827c4.purchase && (_0x1827c4.purchase.refunded || _0x1827c4.purchase.chargebacked)) {
        _0x23601c = "This license was refunded or disputed.";
    }
    setStatusText("Activation failed: " + _0x23601c, "licenseStatus");
    setButtonState(document.getElementById("verifyLicenseBtn"), false, "Activate");
    csInterface.evalScript("saveLicenseState(\"false\", \"\")");
}

function handleNetworkError(_0x24799c) {
    setButtonState(document.getElementById("verifyLicenseBtn"), false, "Activate");
    setStatusText("Network Error: " + (_0x24799c && _0x24799c.message ? _0x24799c.message : "Could not connect."), 'licenseStatus');
}

async function reVerifyLicenseQuietly(_0x52b9d9) {
    try {
        const _0x43d3c8 = await serverVerifyNoInc(_0x52b9d9, "lg_c16J0-Vp21D27hbI4XQ==");
        if (!_0x43d3c8 || !_0x43d3c8.purchase) {
            return;
        }
        const _0x3d0c4b = detectTier(_0x43d3c8.purchase);
        const _0x39fa24 = localStorage.getItem("userTier") || "free";
        if (_0x3d0c4b !== _0x39fa24) {
            localStorage.setItem("userTier", _0x3d0c4b);
            updateProLocks(_0x3d0c4b === "pro");
            updateUserTierBadge();
            updateUserTierStatusLine();
        }
    } catch (_0x3b9cc9) {
    }
}

function xhrPost(_0x3067e9, _0xf334b3, _0xef739e, _0x3564c1, _0x3b83da) {
    var _0x52feef;
    var _0x5f1b4a = _0x3b83da || "application/x-www-form-urlencoded; charset=UTF-8";
    try {
        var _0xa5d1ee = new XMLHttpRequest();
        _0xa5d1ee.open("POST", _0x3067e9, true);
        _0xa5d1ee.timeout = 0x3a98;
        _0xa5d1ee.setRequestHeader("Accept", "application/json");
        _0xa5d1ee.setRequestHeader("Content-Type", _0x5f1b4a);
        _0xa5d1ee.onreadystatechange = function () {
            if (_0xa5d1ee.readyState !== 0x4) {
                return;
            }
            var _0x5f18b4 = _0xa5d1ee.responseText || '';
            var _0x3dddbb = {};
            try {
                _0x3dddbb = _0x5f18b4 ? JSON.parse(_0x5f18b4) : {};
            } catch (_0x401fe6) {
            }
            if (_0xa5d1ee.status >= 0xc8 && _0xa5d1ee.status < 0x12c) {
                _0xef739e(_0x3dddbb);
            } else {
                _0x3564c1(new Error("HTTP " + _0xa5d1ee.status + ": " + (_0x3dddbb.message || _0xa5d1ee.statusText || "Request failed")));
            }
        };
        _0xa5d1ee.ontimeout = function () {
            _0x3564c1(new Error("Request timed out"));
        };
        _0xa5d1ee.onerror = function () {
            _0x3564c1(new Error("Network error"));
        };
        if (_0x5f1b4a.includes("json")) {
            _0x52feef = JSON.stringify(_0xf334b3);
        } else {
            _0x52feef = Object.keys(_0xf334b3).map(function (_0x4ceb44) {
                return encodeURIComponent(_0x4ceb44) + '=' + encodeURIComponent(_0xf334b3[_0x4ceb44]);
            }).join('&');
        }
        _0xa5d1ee.send(_0x52feef);
    } catch (_0xa3b9cb) {
        _0x3564c1(_0xa3b9cb);
    }
}

function gumroadVerify(_0x34ddcf, _0x19420a, _0x1b25b3, _0x3e045) {
    const _0x16e85f = {
        "product_id": "lg_c16J0-Vp21D27hbI4XQ==",
        "license_key": _0x34ddcf,
        "increment_uses_count": !!(_0x19420a && _0x19420a.increment)
    };
    xhrPost('https://api.gumroad.com/v2/licenses/verify', _0x16e85f, _0x1b25b3, _0x3e045);
}

function licenseStorageKey(_0x386eed) {
    return "lastActiveDevice_" + simpleHash(_0x386eed + "lg_c16J0-Vp21D27hbI4XQ==");
}

function ensureDeviceBinding(_0x103325) {
    if (!csInterface) {
        _0x103325(true);
        return;
    }
    csInterface.evalScript("getLicenseState()", function (_0x4ec769) {
        if (_0x4ec769 !== "true") {
            _0x103325(true);
            return;
        }
        csInterface.evalScript("getLicenseKey()", function (_0x3a7d52) {
            if (!_0x3a7d52) {
                _0x103325(true);
                return;
            }
            csInterface.evalScript("getDeviceID()", function (_0x3b136a) {
                var _0x2ab4aa = "lastActiveDevice_" + simpleHash(_0x3a7d52 + "lg_c16J0-Vp21D27hbI4XQ==");
                var _0x333cb5 = localStorage.getItem(_0x2ab4aa);
                if (_0x333cb5 && _0x333cb5 !== _0x3b136a) {
                    setCooldown(_0x3a7d52);
                    localStorage.setItem("userTier", "free");
                    updateProLocks(false);
                    updateUserTierBadge();
                    updateUserTierStatusLine();
                    refreshTierUI();
                    setLicenseStatusInfo("Inactive", false);
                    csInterface.evalScript("saveLicenseState(\"false\", \"\")");
                    showCustomAlert("Your license is active on another device. This device has been logged out. Please activate again here if you want to take over.");
                    document.getElementById("main-app-container").classList.add("hidden");
                    showView("activation-view");
                    _0x103325(false);
                } else {
                    _0x103325(true);
                }
            });
        });
    });
}

function forceRecheckLicense() {
    csInterface.evalScript("getDeviceID()", function (_0x22b767) {
        csInterface.evalScript("getLicenseKey()", function (_0x238834) {
            if (!_0x238834) {
                return;
            }
            const _0x3c19f4 = {
                "increment": false
            };
            gumroadVerify(_0x238834, _0x3c19f4, function (_0x4d524c) {
                if (_0x4d524c.success && _0x4d524c.purchase) {
                    var _0x269ccb = simpleHash(_0x238834 + "lg_c16J0-Vp21D27hbI4XQ==");
                    var _0x35b8a8 = localStorage.getItem("lastActiveDevice_" + _0x269ccb);
                    if (_0x35b8a8 && _0x35b8a8 !== _0x22b767) {
                        localStorage.setItem("userTier", "free");
                        updateProLocks(false);
                        updateUserTierBadge();
                        updateUserTierStatusLine();
                        setLicenseStatusInfo("Inactive", false);
                        csInterface.evalScript("saveLicenseState(\"false\", \"\")");
                    } else {
                        var _0x4863ad = detectTier(_0x4d524c.purchase);
                        localStorage.setItem("userTier", _0x4863ad);
                        updateProLocks(_0x4863ad === "pro");
                        updateUserTierBadge();
                        updateUserTierStatusLine();
                        setLicenseStatusInfo("Active", true);
                    }
                } else {
                    localStorage.setItem("userTier", "free");
                    updateProLocks(false);
                    updateUserTierBadge();
                    updateUserTierStatusLine();
                    setLicenseStatusInfo("Inactive", false);
                    csInterface.evalScript("saveLicenseState(\"false\", \"\")");
                }
            }, function (_0xcf760e) {
            });
        });
    });
}

let heartbeatTimer = null;
let hbStageIndex = 0x0;
let hbInFlight = false;
const PRO_STAGES_MS = [14400000, 28800000, 86400000, 259200000, 604800000, 1296000000];

function scheduleNext(_0x10a810) {
    if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
    }
    heartbeatTimer = setTimeout(runHeartbeatOnce, _0x10a810);
}

async function runHeartbeatOnce() {
    if (hbInFlight) {
        return;
    }
    hbInFlight = true;
    try {
        const _0x23073a = await new Promise(_0x4b2fb1 => csInterface.evalScript('getLicenseKey()', _0x4b2fb1));
        if (!_0x23073a) {
            hbInFlight = false;
            scheduleNext(1296000000);
            return;
        }
        const _0x4f94d4 = await new Promise(_0x1b0238 => csInterface.evalScript('getDeviceID()', _0x1b0238));
        const _0xac1c93 = await serverHeartbeat(_0x23073a, "lg_c16J0-Vp21D27hbI4XQ==", _0x4f94d4);
        if (_0xac1c93 && _0xac1c93.logout) {
            setCooldown(_0x23073a);
            localStorage.setItem("userTier", "free");
            updateProLocks(false);
            updateUserTierBadge();
            updateUserTierStatusLine();
            setLicenseStatusInfo("Inactive", false);
            csInterface.evalScript("saveLicenseState(\"false\", \"\")");
            showCustomAlert("Your license is now active on another device. You have been logged out here.");
            document.getElementById("main-app-container")?.["classList"]["add"]("hidden");
            showView("activation-view");
            if (heartbeatTimer) {
                clearTimeout(heartbeatTimer);
            }
            hbInFlight = false;
            return;
        }
        const _0x3aa9b4 = (localStorage.getItem("userTier") || "free").toLowerCase();
        if (_0x3aa9b4 === "pro") {
            hbStageIndex = Math.min(hbStageIndex + 0x1, PRO_STAGES_MS.length - 0x1);
            scheduleNext(PRO_STAGES_MS[hbStageIndex]);
        } else {
            scheduleNext(1296000000);
        }
    } catch (_0x18a615) {
        scheduleNext(1800000);
    } finally {
        hbInFlight = false;
    }
}

function startLicenseHeartbeat() {
    if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
    }
    hbStageIndex = 0x0;
    const _0x5b1958 = (localStorage.getItem("userTier") || "free").toLowerCase();
    if (_0x5b1958 === "pro") {
        scheduleNext(PRO_STAGES_MS[hbStageIndex]);
    } else {
        scheduleNext(1296000000);
    }
}

function stopLicenseHeartbeat() {
    if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
    }
    heartbeatTimer = null;
    hbInFlight = false;
    hbStageIndex = 0x0;
}

function resetHeartbeatCadence() {
    hbStageIndex = 0x0;
}

function setProcessingState(_0x48b4f5) {
    const _0x2e2831 = document.getElementById("generateBtn");
    if (!_0x2e2831) {
        return;
    }
    if (_0x48b4f5) {
        _0x2e2831.disabled = true;
        _0x2e2831.innerHTML = "<span class=\"loading-spinner\"></span> Processing...";
    } else {
        _0x2e2831.disabled = false;
        _0x2e2831.textContent = "Generate Captions";
    }
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
    _0x47ad3e("enterKeyBtn", "click", _0x547888 => {
        _0x547888.preventDefault();
        stopLicenseHeartbeat();
        document.getElementById("main-app-container")?.["classList"]["add"]('hidden');
        showView("activation-view");
        resetActivationView();
        setupActivationListeners();
        setTimeout(() => document.getElementById("licenseKeyInput")?.["focus"](), 0x0);
    });
    _0x47ad3e("enterLicenseBtn", "click", function (_0x1c4382) {
        _0x1c4382.preventDefault();
        stopLicenseHeartbeat();
        document.getElementById("main-app-container")?.["classList"]["add"]('hidden');
        showView("activation-view");
        resetActivationView();
        setupActivationListeners();
        setTimeout(() => document.getElementById("licenseKeyInput")?.['focus'](), 0x0);
    });
    _0x47ad3e("getProBtn", "click", function () {
        showProUpgradeMessage();
    });
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
    const _0x1e4e1a = document.getElementById('langCode');
    if (_0x1e4e1a) {
        _0x1e4e1a.addEventListener("change", function (_0x24f91f) {
            const _0x545df8 = localStorage.getItem("userTier") || "free";
            if (_0x545df8 !== "pro" && _0x24f91f.target.value === "auto") {
                const _0x3b16f1 = Array.from(_0x1e4e1a.options).find(_0x4af346 => !_0x4af346.disabled && _0x4af346.value !== "auto");
                if (_0x3b16f1) {
                    _0x1e4e1a.value = _0x3b16f1.value;
                }
                showProUpgradeMessage();
            }
        });
    }
    const _0xe55d55 = document.getElementById("licenseKeyInput");
    if (_0xe55d55) {
        _0xe55d55.addEventListener("keydown", _0x271f25 => {
            if (_0x271f25.key === "Enter") {
                _0x271f25.preventDefault();
                const _0x6cf1fa = document.getElementById("verifyLicenseBtn");
                if (!_0x6cf1fa?.["disabled"]) {
                    handleVerifyLicense();
                }
            }
        });
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
    const _0x56f025 = localStorage.getItem("userTier") || "free";
    if (!validateProFeatureAccess(_0x56f025)) {
        showProUpgradeMessage();
        return;
    }
    if (!canWeeklyRun(_0x56f025)) {
        return;
    }
    startProcess();
}

function validateProFeatureAccess(_0x5e6317) {
    if (_0x5e6317 === "pro") {
        return true;
    }
    const _0x37ec2e = {
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
    if (_0x37ec2e.doBatch) {
        onBatchModeEnabled();
        return false;
    }
    if (_0x37ec2e.modelSize === "medium" || _0x37ec2e.modelSize === "large") {
        return false;
    }
    if (_0x37ec2e.doTranslateToEnglish) {
        onTranslateToEnglishEnabled();
        return false;
    }
    if (_0x37ec2e.langCode === "auto") {
        return false;
    }
    return true;
}

function updateUserTierBadge() {
    const _0x1e7dd4 = document.getElementById("userTierBadge");
    const _0x2c9a49 = localStorage.getItem("userTier") || "free";
    if (!_0x1e7dd4) {
        return;
    }
    if (_0x2c9a49 === "pro") {
        _0x1e7dd4.textContent = "Pro User";
        _0x1e7dd4.className = "user-tier-badge pro";
    } else {
        _0x1e7dd4.textContent = "Free User";
        _0x1e7dd4.className = "user-tier-badge free";
    }
}

function refreshTierUI() {
    const _0x2e5934 = (localStorage.getItem("userTier") || "free").toLowerCase();
    const _0x3dea3b = document.getElementById("upgradeCard");
    if (_0x3dea3b) {
        _0x3dea3b.classList.toggle('hidden', _0x2e5934 === "pro");
    }
}

function resetActivationView() {
    const _0x3018e0 = document.getElementById("licenseKeyInput");
    const _0x2511dc = document.getElementById('verifyLicenseBtn');
    setStatusText('', "licenseStatus");
    if (_0x3018e0) {
        _0x3018e0.value = '';
    }
    if (_0x2511dc) {
        setButtonState(_0x2511dc, false, "Activate");
    }
}

function closeModal(_0xaa47b3 = "app-modal") {
    const _0xa18a52 = document.getElementById(_0xaa47b3);
    if (_0xa18a52) {
        _0xa18a52.remove();
    }
}

function updateUtilitiesPanel(_0x3b2fef) {
    const _0x37d759 = document.getElementById("upgradeCard");
    if (_0x3b2fef && _0x3b2fef.variants && _0x3b2fef.variants.includes("(Pro)")) {
        if (_0x37d759) {
            _0x37d759.style.display = "none";
        }
    } else {
        if (_0x37d759) {
            _0x37d759.style.display = "block";
        }
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

const _0x542c1b = {
    text: "Close"
};

function showCustomCard(_0x196d72, _0x19bb04, _0x366039 = [_0x542c1b]) {
    showModal({
        'id': "custom-card-modal",
        'title': _0x196d72,
        'message': _0x19bb04,
        'buttons': _0x366039.map(_0x5ccb22 => ({
            'text': _0x5ccb22.text,
            'action': _0x5ccb22.onClick,
            'primary': _0x5ccb22.variant === "primary",
            'variant': _0x5ccb22.variant
        }))
    });
}

function initializeStickyGenerateButton() {
    return document.getElementById("generateBtn");
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
        'buttons': [{
            'text': "Get Pro",
            'primary': true,
            'action': function () {
                if (typeof cep !== "undefined" && cep.util) {
                    cep.util.openURLInDefaultBrowser("https://mukeshfx.gumroad.com/l/Autocaptionspro");
                } else {
                    window.open("https://mukeshfx.gumroad.com/l/Autocaptionspro", "_blank");
                }
            }
        }, _0x4928a7]
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

function showProUpgradeMessage() {
    const _0x9ecca3 = {
        "text": "Close",
        "primary": false
    };
    showModal({
        'id': "pro-upgrade-modal",
        'title': "Upgrade to AutoCaption Pro",
        'message': "\n            Unlock <b>Batch Mode</b>, <b>Translate</b>, and <b>Unlimited Generations</b>.\n        ",
        'buttons': [{
            'text': "🔗 Get Pro Now",
            'primary': true,
            'action': function () {
                if (typeof cep !== "undefined" && cep.util) {
                    cep.util.openURLInDefaultBrowser("https://mukeshfx.gumroad.com/l/Autocaptionspro");
                } else {
                    window.open("https://mukeshfx.gumroad.com/l/Autocaptionspro", "_blank");
                }
            }
        }, _0x9ecca3]
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

function showThankYouPro() {
    if (localStorage.getItem("pro_thanks_shown_v1") === "true") {
        return;
    }
    localStorage.setItem("pro_thanks_shown_v1", "true");
    showCustomCard("You're Pro now — Thank you! 🙌", "\n    <div style=\"margin-bottom:10px;\">You’ve unlocked premium features.</div>\n    <div style=\"margin-top:12px;color:#9aa0a6;font-size:12px;\">\n      Want to learn tips & tricks? Follow <b>Mukeshfx</b> on social media!\n    </div>\n  ", [{
        'text': "Follow on YouTube",
        'variant': "base",
        'onClick': () => window.open("https://youtube.com/@mukeshfx", "_blank")
    }, {
        'text': "Close",
        'variant': "primary"
    }]);
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

function resetActivationView() {
    const _0x11f989 = document.getElementById("licenseKeyInput");
    const _0x2ea29f = document.getElementById("verifyLicenseBtn");
    const _0x3e6f25 = document.getElementById("licenseStatus");
    if (_0x11f989) {
        _0x11f989.value = '';
    }
    if (_0x2ea29f) {
        _0x2ea29f.disabled = false;
        _0x2ea29f.textContent = "Activate";
        _0x2ea29f.classList.remove('btn-success');
    }
    if (_0x3e6f25) {
        _0x3e6f25.textContent = '';
    }
}

function goToActivation() {
    document.getElementById("main-app-container")?.['classList']["add"]("hidden");
    showView("activation-view");
}

function updateUserTierStatusLine() {
    const _0xe159c1 = document.getElementById("userTierStatus");
    if (!_0xe159c1) {
        return;
    }
    const _0x5281a7 = (localStorage.getItem("userTier") || "free").toLowerCase();
    _0xe159c1.textContent = _0x5281a7 === "pro" ? "Pro" : "Free";
    _0xe159c1.classList.remove("status-connected", "status-disconnected");
    _0xe159c1.classList.add(_0x5281a7 === "pro" ? "status-connected" : "status-disconnected");
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

function setLicenseStatusInfo(_0x56091f, _0x314373) {
    var _0x2133ac = document.getElementById("licenseStatusInfo");
    if (!_0x2133ac) {
        return;
    }
    _0x2133ac.textContent = _0x56091f;
    _0x2133ac.className = "info-value " + (_0x314373 ? "status-connected" : "status-disconnected");
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
                        stopLicenseHeartbeat();
                        const app = document.getElementById("main-app-container");
                        if (app) {
                            app.classList.add("hidden");
                        }
                        showResetBlankScreen();
                        const _0x11a81d = _0x20c91c.licenseValid === "true" || _0x20c91c.licenseValidFlag === "true" || _0x20c91c.licenseValidFromHost === "true";
                        localStorage.setItem("userTier", _0x11a81d ? "pro" : "free");
                        updateProLocks(_0x11a81d);
                        updateUserTierBadge();
                        updateUserTierStatusLine();
                        refreshTierUI();
                        if (_0x11a81d) {
                            setTimeout(startLicenseHeartbeat, 0x1f4);
                        }
                    });
                } else {
                    stopLicenseHeartbeat();
                    showResetBlankScreen();
                    localStorage.setItem("userTier", "free");
                    updateProLocks(false);
                    updateUserTierBadge();
                    updateUserTierStatusLine();
                    refreshTierUI();
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
    if ((localStorage.getItem("userTier") || "free") !== "pro") {
        bumpWeeklyRun();
    }
    stopProcess();
    setProgress(0x64);
    setStatusText("Captions generated successfully!", "statusText");
    localStorage.setItem("last-run-time", Date.now().toString());
    var _0x4be0fa = (parseInt(localStorage.getItem("total-processed") || '0') || 0x0) + 0x1;
    localStorage.setItem("total-processed", _0x4be0fa.toString());
    updateExtensionInfo();
    setTimeout(function () {
        document.getElementById("progressContainer").classList.add("hidden");
    }, 0xbb8);
}

function handleProcessError() {
    stopProcess();
    csInterface.evalScript("getProgressMessage()", function (_0x3a0161) {
        var _0x15cbf3 = _0x3a0161 || "Process failed. Check logs for details.";
        setStatusText(_0x15cbf3, "statusText");
        showCustomAlert("Process failed: " + _0x15cbf3);
    });
}

function collectSettings() {
    return {
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

function openBuyLink(_0x285707) {
    _0x285707.preventDefault();
    csInterface.openURLInDefaultBrowser(this.href);
}

function detectTier(_0x1f9404) {
    const _0x25685d = !!_0x1f9404.recurrence && !_0x1f9404.subscription_cancelled_at && !_0x1f9404.subscription_ended_at && !_0x1f9404.subscription_failed_at;
    const _0x33292b = (_0x1f9404.price || 0x0) > 0x0;
    const _0x4cc167 = /pro/i.test(_0x1f9404.variants || '');
    return _0x33292b || _0x4cc167 || _0x25685d ? "pro" : "free";
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

function _weekKeyIST() {
    const _0xf6d634 = new Date();
    const _0x11ecc5 = new Date(_0xf6d634.getTime() + 19800000);
    const _0x2e2825 = new Date(Date.UTC(_0x11ecc5.getUTCFullYear(), _0x11ecc5.getUTCMonth(), _0x11ecc5.getUTCDate()));
    const _0x81c787 = _0x2e2825.getUTCDay() || 0x7;
    _0x2e2825.setUTCDate(_0x2e2825.getUTCDate() + 0x4 - _0x81c787);
    const _0x2376a3 = _0x2e2825.getUTCFullYear();
    const _0x3eee11 = new Date(Date.UTC(_0x2376a3, 0x0, 0x1));
    const _0x30cfad = Math.ceil(((_0x2e2825 - _0x3eee11) / 0x5265c00 + 0x1) / 0x7);
    return _0x2376a3 + 'W' + String(_0x30cfad).padStart(0x2, '0');
}

function getFreeWeeklyMax(_0x56011a = new Date()) {
    const _0x43ae42 = _0x56011a.getMonth();
    if (_0x43ae42 === 0x7) {
        return 0x64;
    } else {
        if (_0x43ae42 === 0x8) {
            return 0x32;
        } else {
            if (_0x43ae42 >= 0x9) {
                return 0x5;
            } else {
                return 0x5;
            }
        }
    }
}

function checkWeeklyLimit(_0x2ab32d) {
    if (_0x2ab32d === 'pro') {
        return true;
    }
    const _0x325ab8 = getFreeWeeklyMax();
    const _0x416605 = 'freeRunsW:' + _weekKeyIST();
    const _0x367cb5 = parseInt(localStorage.getItem(_0x416605) || '0', 0xa);
    if (_0x367cb5 >= _0x325ab8) {
        showCustomAlert("Free plan weekly limit reached (" + _0x325ab8 + " runs). Upgrade to Pro for unlimited use.");
        return false;
    }
    localStorage.setItem(_0x416605, String(_0x367cb5 + 0x1));
    return true;
}

function weeklyKey() {
    return "freeRunsW:" + _weekKeyIST();
}

function weeklyUsed() {
    return parseInt(localStorage.getItem("freeRunsW:" + _weekKeyIST()) || '0', 0xa);
}

function canWeeklyRun(_0x18ad59) {
    if (_0x18ad59 === "pro") {
        return true;
    }
    const _0x181c64 = getFreeWeeklyMax();
    const _0x1b6da6 = parseInt(localStorage.getItem("freeRunsW:" + _weekKeyIST()) || '0', 0xa);
    if (_0x1b6da6 >= _0x181c64) {
        showCustomAlert("Free plan weekly limit reached (" + _0x181c64 + " runs). Upgrade to Pro for unlimited use.");
        return false;
    }
    return true;
}

function bumpWeeklyRun() {
    const _0x48dedc = "freeRunsW:" + _weekKeyIST();
    const _0x46f8c7 = parseInt(localStorage.getItem("freeRunsW:" + _weekKeyIST()) || '0', 0xa);
    localStorage.setItem(_0x48dedc, String(_0x46f8c7 + 0x1));
}

function openLicenseEntryFromUtilities() {
    stopLicenseHeartbeat();
    document.getElementById("main-app-container")?.["classList"]["add"]('hidden');
    showView('activation-view');
    resetActivationView();
    setupActivationListeners();
    setTimeout(() => document.getElementById("licenseKeyInput")?.["focus"](), 0x0);
}
