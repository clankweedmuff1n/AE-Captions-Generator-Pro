// need to be fixed

function isWindows() {
    return $.os.indexOf("Windows") > -1;
}

function writeProgress(pythonToolPath, msg) {
    if (!pythonToolPath) {
        return;
    }
    try {
        var f = new File(pythonToolPath + "/progress.log");
        f.open("w");
        f.write(msg);
        f.close();
    } catch (e) {
    }
}

function isValidVideoFilePath(fsName) {
    if (!fsName) {
        return false;
    }
    var lower = fsName.toLowerCase();
    return lower.match(/\.(mp4|mov|mkv|m4v|avi|mpg|mpeg|wmv|mts|m2ts|flv|webm)$/) !== null;
}

function isValidAudioFilePath(fsName) {
    if (!fsName) {
        return false;
    }
    var lower = fsName.toLowerCase();
    return lower.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/) !== null;
}

function getSourceVideoFPS(layer) {
    try {
        if ((!layer) || (!(layer instanceof AVLayer))) {
            return null;
        }
        var source = layer.source;
        if ((!source) || (!source.file)) {
            return null;
        }
        if ((source.conformFrameRate) && (source.conformFrameRate > 0)) {
            return source.conformFrameRate;
        }
        if ((source.frameRate) && (source.frameRate > 0)) {
            return source.frameRate;
        }
        if ((source.mainSource) && (source.mainSource.frameRate)) {
            return source.mainSource.frameRate;
        }
        return null;
    } catch (e) {
        return null;
    }
}

function validateAndGetFPS(layer, compFPS) {
    var sourceFPS = getSourceVideoFPS(layer);
    if ((sourceFPS) && (sourceFPS > 0)) {
        var standardRates = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
        var closest = sourceFPS;
        var minDiff = Math.abs(sourceFPS - standardRates[0]);
        for (var i = 1; i < standardRates.length; i += 1) {
            var diff = Math.abs(sourceFPS - standardRates[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closest = standardRates[i];
            }
        }
        if (minDiff < 0.1) {
            return closest;
        }
        return sourceFPS;
    }
    return (compFPS) || (29.97);
}

function getInitialState() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING)) {
            var savedPath = app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING);
            if ((savedPath) && (isValidBackendPath(savedPath))) {
                return "true";
            }
        }
    } catch (e) {
    }
    return "false";
}

function isValidBackendPath(basePath) {
    var standaloneBackend = new File(basePath + "/AutoCaptionGenerator");
    if (standaloneBackend.exists) {
        return true;
    }
    var exeBackend = new File(basePath + isWindows() ? "/caption-backend.exe" : "/caption-backend");
    if (exeBackend.exists) {
        return true;
    }
    var shLauncher = new File(basePath + "/run_captions.sh");
    var venvPython = new File(basePath + isWindows() ? "/venv/Scripts/python.exe" : "/venv/bin/python3");
    var pyScript = new File(basePath + "/generate_captions_auto.py");
    return ((shLauncher.exists) && (venvPython.exists)) && (pyScript.exists);
}

function selectPythonToolFolder() {
    try {
        var folder = Folder.selectDialog("Select AutoCaption Toolkit folder");
        if (!folder) {
            return "User canceled folder selection";
        }
        var basePath = folder.fsName;
        writeProgress(basePath, "DEBUG: Selected folder: " + basePath);
        if (!isValidBackendPath(basePath)) {
            return "Invalid folder selected. Please choose a Toolkitfolder";
        }
        if (!isWindows()) {
            try {
                var standaloneBackend = new File(basePath + "/AutoCaptionGenerator");
                if (standaloneBackend.exists) {
                    system.callSystem("chmod +x \"" + standaloneBackend.fsName + "\"");
                }
                var shLauncher = new File(basePath + "/run_captions.sh");
                if (shLauncher.exists) {
                    system.callSystem("chmod +x \"" + shLauncher.fsName + "\"");
                }
            } catch (permErr) {
            }
        }
        app.settings.saveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING, basePath);
        return "success";
    } catch (e) {
        return "Selection error: " + e.message + " (Line: " + e.line + ")";
    }
}

function runBackendOnce(pythonToolPath, argsArray) {
    var standaloneBackend = new File(pythonToolPath + "/AutoCaptionGenerator");
    if (standaloneBackend.exists) {
        var cmd = "\"" + standaloneBackend.fsName + "\" " + argsArray.join(" ");
        return system.callSystem(cmd);
    }
    var exeBackend = new File(pythonToolPath + isWindows() ? "/caption-backend.exe" : "/caption-backend");
    if (exeBackend.exists) {
        var cmd = "\"" + exeBackend.fsName + "\" " + argsArray.join(" ");
        return system.callSystem(cmd);
    }
    var shLauncher = new File(pythonToolPath + "/run_captions.sh");
    if ((!isWindows()) && (shLauncher.exists)) {
        var cmd = "sh \"" + shLauncher.fsName + "\" " + argsArray.join(" ");
        return system.callSystem(cmd);
    }
    var venvPython = new File(pythonToolPath + isWindows() ? "/venv/Scripts/python.exe" : "/venv/bin/python3");
    var pyScript = new File(pythonToolPath + "/generate_captions_auto.py");
    if ((venvPython.exists) && (pyScript.exists)) {
        var cmd = "\"" + venvPython.fsName + "\" -u \"" + pyScript.fsName + "\" " + argsArray.join(" ");
        return system.callSystem(cmd);
    }
    var sysPy = isWindows() ? "python" : "python3";
    var cmd = sysPy + " -u \"" + pyScript.fsName + "\" " + argsArray.join(" ");
    return system.callSystem(cmd);
}

function forceClearStaleLock(pythonToolPath) {
    try {
        var lockFile = new File(pythonToolPath + "/process.lock");
        if (!lockFile.exists) {
            return false;
        }
        var fiveMinutes = 300000;
        if ((new Date() - lockFile.modified) > fiveMinutes) {
            lockFile.remove();
            return true;
        }
    } catch (e) {
    }
    return false;
}

function runFullProcess(encodedSettings) {
    function fail(message) {
        if (pythonToolPath) {
            writeProgress(pythonToolPath, "  " + message);
        }
    }

    var pythonToolPath = app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) ? app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) : null;
    if (!pythonToolPath) {
        fail("Backend path not set. Please select backend folder first.");
        return;
    }
    try {
        var settings = JSON.parse(decodeURIComponent(encodedSettings));
        var comp = app.project.activeItem;
        if ((!comp) || (!(comp instanceof CompItem))) {
            fail("Please open a composition first.");
            return;
        }
        var layersToProcess = [];
        if (settings.doBatch) {
            for (var i = 1; i <= comp.numLayers; i += 1) {
                var layer = comp.layer(i);
                if ((((layer instanceof AVLayer) && (layer.source)) && (layer.source.file)) && (((layer.hasVideo) && (isValidVideoFilePath(layer.source.file.fsName))) || ((layer.hasAudio) && (isValidAudioFilePath(layer.source.file.fsName))))) {
                    layersToProcess.push(layer);
                }
            }
            layersToProcess.sort(function (a, b) {
                return b.index - a.index;
            });
            if (layersToProcess.length === 0) {
                fail("No valid video or audio layers found in composition.");
                return;
            }
        } else {
            if (comp.selectedLayers.length === 0) {
                fail("Please select a video layer.");
                return;
            }
            var selectedLayer = comp.selectedLayers[0];
            if ((((!(selectedLayer instanceof AVLayer)) || (!selectedLayer.source)) || (!selectedLayer.source.file)) || (((!selectedLayer.hasVideo) || (!isValidVideoFilePath(selectedLayer.source.file.fsName))) && ((!selectedLayer.hasAudio) || (!isValidAudioFilePath(selectedLayer.source.file.fsName))))) {
                fail("Selected layer is not a valid video or audio file.");
                return;
            }
            layersToProcess.push(selectedLayer);
        }
        var primaryLayer = layersToProcess[0];
        var sourceFPS = validateAndGetFPS(primaryLayer, comp.frameRate);
        settings.sourceFPS = sourceFPS;
        settings.compFPS = comp.frameRate;
        var lockFile = new File(pythonToolPath + "/process.lock");
        if (lockFile.exists) {
            if (!forceClearStaleLock(pythonToolPath)) {
                fail("Another process is running. If stuck, delete \'process.lock\' from backend folder.");
                return;
            }
        }
        var progressFile = new File(pythonToolPath + "/progress.log");
        if (progressFile.exists) {
            progressFile.remove();
        }
        var jsonFile = new File(pythonToolPath + "/captions.json");
        if (jsonFile.exists) {
            jsonFile.remove();
        }
        app.settings.saveSetting(SETTINGS_SECTION, LAST_USED_SETTINGS, JSON.stringify(settings));
        var layersInfo = [];
        for (var j = 0; j < layersToProcess.length; j += 1) {
            var layer = layersToProcess[j];
            var layerFPS = validateAndGetFPS(layer, comp.frameRate);
            layersInfo.push({
                filePath: layer.source.file.fsName,
                inPoint: layer.inPoint,
                name: layer.name,
                outPoint: layer.outPoint,
                sourceFPS: layerFPS,
                startTime: layer.startTime
            });
        }
        app.settings.saveSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS, JSON.stringify(layersInfo));
        app.settings.saveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX, "0");
        writeProgress(pythonToolPath, "PROGRESS: 0/5 - Initializing...");
        runNextLayer();
    } catch (e) {
        fail("Unexpected error: " + e.message);
    }
}

function runNextLayer() {
    try {
        var pythonToolPath = app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING);
        var layersInfo = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS));
        var currentIndex = parseInt(app.settings.getSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX), 10);
        var settings = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAST_USED_SETTINGS));
        if (currentIndex >= layersInfo.length) {
            return;
        }
        var currentLayerInfo = layersInfo[currentIndex];
        var sourceStartTime = currentLayerInfo.inPoint - currentLayerInfo.startTime;
        var trimDuration = currentLayerInfo.outPoint - currentLayerInfo.inPoint;
        var taskType = settings.doTranslateToEnglish ? "translate" : "transcribe";
        var srtFileName = settings.doBatch ? "captions_" + currentLayerInfo.name.replace(/\W+/g, "_") + "_" + currentIndex + ".srt" : "captions.srt";
        var srtFilePath = pythonToolPath + "/" + srtFileName;
        var args = ["\"" + pythonToolPath + "\"", "\"" + currentLayerInfo.filePath + "\"", String(settings.maxChars), String(settings.maxDuration), String(settings.gapFrames), "\"" + settings.lineMode + "\"", sourceStartTime.toFixed(4), trimDuration.toFixed(4), "\"" + settings.langCode + "\"", "\"" + settings.modelSize + "\"", String(settings.doExportSrt), "\"" + srtFilePath + "\"", String(currentLayerInfo.sourceFPS), "\"" + taskType + "\""];
        forceClearStaleLock(pythonToolPath);
        runBackendOnce(pythonToolPath, args);
    } catch (e) {
        writeProgress(pythonToolPath, "  in runNextLayer: " + e.message);
    }
}

function getProcessStatus() {
    var pythonToolPath = app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) ? app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) : null;
    if (!pythonToolPath) {
        return "error";
    }
    try {
        var lockFile = new File(pythonToolPath + "/process.lock");
        if (lockFile.exists) {
            return "running";
        }
        var jsonFile = new File(pythonToolPath + "/captions.json");
        if (jsonFile.exists) {
            var ok = importCurrentLayerCaptions();
            if (ok) {
                var layersInfo = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS));
                var currentIndex = parseInt(app.settings.getSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX), 10);
                if (currentIndex < layersInfo.length) {
                    if (jsonFile.exists) {
                        jsonFile.remove();
                    }
                    var progressFile = new File(pythonToolPath + "/progress.log");
                    if (progressFile.exists) {
                        progressFile.remove();
                    }
                    runNextLayer();
                    return "running";
                } else {
                    return "finished";
                }
            } else {
                return "error";
            }
        } else {
            var progressFile = new File(pythonToolPath + "/progress.log");
            if (progressFile.exists) {
                progressFile.open("r");
                var lastLine = "";
                while (!progressFile.eof) {
                    lastLine = progressFile.readln();
                }
                progressFile.close();
                if ((lastLine) && (lastLine.toLowerCase().indexOf("success") > -1)) {
                    return "finished";
                }
                if ((lastLine) && (lastLine.indexOf(" ") > -1)) {
                    return "error";
                }
                return "running";
            }
        }
    } catch (e) {
        return "error";
    }
    return "error";
}

function getProgressMessage() {
    var pythonToolPath = app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) ? app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) : null;
    if (!pythonToolPath) {
        return "Backend path not set";
    }
    var layerPrefix = "";
    try {
        var layersInfo = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS));
        var currentIndex = parseInt(app.settings.getSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX), 10);
        if ((layersInfo) && (layersInfo.length > 1)) {
            var currentLayer = layersInfo[currentIndex];
            if ((currentLayer) && (currentLayer.sourceFPS)) {
                layerPrefix = "Layer " + currentIndex + 1 + "/" + layersInfo.length + " (" + currentLayer.sourceFPS.toFixed(2) + "fps): ";
            } else {
                layerPrefix = "Layer " + currentIndex + 1 + "/" + layersInfo.length + ": ";
            }
        }
    } catch (e) {
    }
    try {
        var progressFile = new File(pythonToolPath + "/progress.log");
        if (progressFile.exists) {
            progressFile.open("r");
            var lastLine = "";
            while (!progressFile.eof) {
                lastLine = progressFile.readln();
            }
            progressFile.close();
            if (lastLine) {
                if (lastLine.toLowerCase().indexOf("success") > -1) {
                    return layerPrefix + lastLine;
                }
                if (lastLine.indexOf("PROGRESS") > -1) {
                    var parts = lastLine.split(" - ");
                    return layerPrefix + (parts[1]) || ("Processing...");
                }
                if (lastLine.indexOf(" ") > -1) {
                    return layerPrefix + lastLine;
                }
                if (lastLine.indexOf("INFO:") > -1) {
                    return layerPrefix + lastLine.replace("INFO: ", "");
                }
                if (lastLine.indexOf("DEBUG:") > -1) {
                    return layerPrefix + lastLine.replace("DEBUG: ", "");
                }
                return layerPrefix + lastLine;
            }
        }
        var status = getProcessStatus();
        if (status === "finished") {
            return "All captions imported successfully!";
        }
        if (status === "error") {
            return "Process failed. Check logs for details.";
        }
        return layerPrefix + "Initializing...";
    } catch (e) {
        return layerPrefix + "Error reading progress";
    }
}

function getProgressPercent() {
    var pythonToolPath = app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) ? app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) : null;
    if (!pythonToolPath) {
        return "0";
    }
    try {
        var progressFile = new File(pythonToolPath + "/progress.log");
        if (progressFile.exists) {
            progressFile.open("r");
            var lastLine = "";
            while (!progressFile.eof) {
                lastLine = progressFile.readln();
            }
            progressFile.close();
            if ((lastLine) && (lastLine.indexOf("PROGRESS") > -1)) {
                var match = lastLine.match(/PROGRESS:\s*(\d+)\/(\d+)/);
                if (match) {
                    var current = parseInt(match[1], 10);
                    var total = parseInt(match[2], 10);
                    return ((current / total) * 100).toString();
                }
            }
            if ((lastLine) && (lastLine.toLowerCase().indexOf("success") > -1)) {
                return "100";
            }
        }
    } catch (e) {
    }
    return "0";
}

function cancelCurrentProcess() {
    var pythonToolPath = app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) ? app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING) : null;
    if (!pythonToolPath) {
        return "false";
    }
    try {
        var cancelFile = new File(pythonToolPath + "/cancel.flag");
        cancelFile.open("w");
        cancelFile.write("cancel");
        cancelFile.close();
        return "true";
    } catch (e) {
        return "false";
    }
}

function importCurrentLayerCaptions() {
    try {
        var base = app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING);
        var jsonFile = new File(base + "/captions.json");
        if (!jsonFile.exists) {
            return false;
        }
        var layersInfo = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS));
        var idx = parseInt(app.settings.getSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX), 10);
        var settings = JSON.parse(app.settings.getSetting(SETTINGS_SECTION, LAST_USED_SETTINGS));
        var comp = app.project.activeItem;
        if (!((comp) && (comp instanceof CompItem))) {
            return false;
        }
        var info = layersInfo[idx];
        if (!info) {
            return false;
        }
        jsonFile.open("r", "UTF-8");
        var raw = jsonFile.read();
        jsonFile.close();
        if (!raw) {
            return false;
        }
        var caps = JSON.parse(raw);
        if (!((caps) && (caps.length))) {
            return false;
        }
        app.beginUndoGroup("Import Captions - FIXED");
        var success = 0;
        if (settings.singleLayerMode) {
            var textLayer = comp.layers.addText(" ");
            var fontSizeMap = {symbol_183: 24, symbol_184: 36, symbol_185: 48, symbol_186: 60};
            var posMap = {
                "0": [comp.width / 2, comp.height - 100],
                "1": [comp.width / 2, 100],
                "2": [comp.width / 2, comp.height / 2]
            };
            var textProp = textLayer.property("Source Text");
            var textDoc = textProp.value;
            textDoc.fontSize = (fontSizeMap[settings.fontSize]) || (36);
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            textDoc.fillColor = [1, 1, 1];
            textLayer.property("Position").setValue((posMap[settings.positionIndex]) || (posMap[0]));
            textProp.setValue(textDoc);
            textLayer.startTime = info.inPoint;
            textLayer.outPoint = info.outPoint;
            textLayer.name = "Captions";
            for (var i = 0; i < caps.length; i += 1) {
                var cap = caps[i];
                if ((!cap) || (typeof cap.text !== "string")) {
                    continue;
                }
                var compStartTime = info.inPoint + cap.start;
                var compEndTime = info.inPoint + cap.end;
                var textOn = textProp.value;
                textOn.text = cap.text.replace(/\r/g, "\r");
                textProp.setValueAtTime(compStartTime, textOn);
                var textOff = textProp.value;
                textOff.text = "";
                textProp.setValueAtTime(compEndTime, textOff);
                success++;
            }
        } else {
            var fontSizeMap2 = {symbol_183: 24, symbol_184: 36, symbol_185: 48, symbol_186: 60};
            var posMap2 = {
                "0": [comp.width / 2, comp.height - 100],
                "1": [comp.width / 2, 100],
                "2": [comp.width / 2, comp.height / 2]
            };
            for (var j = 0; j < caps.length; j += 1) {
                var cap2 = caps[j];
                if ((!cap2) || (typeof cap2.text !== "string")) {
                    continue;
                }
                var tLayer = comp.layers.addText(cap2.text);
                var tProp = tLayer.property("Source Text");
                var tDoc = tProp.value;
                tDoc.fontSize = (fontSizeMap2[settings.fontSize]) || (36);
                tDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
                tDoc.fillColor = [1, 1, 1];
                tLayer.property("Position").setValue((posMap2[settings.positionIndex]) || (posMap2[0]));
                tProp.setValue(tDoc);
                tLayer.startTime = info.inPoint + cap2.start;
                tLayer.outPoint = info.inPoint + cap2.end;
                tLayer.name = "Cap: " + cap2.text.substring(0, 20);
                success++;
            }
        }
        if ((settings.doCleanup) && (jsonFile.exists)) {
            jsonFile.remove();
        }
        app.endUndoGroup();
        app.settings.saveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX, String(idx + 1));
        return success > 0;
    } catch (e) {
        return false;
    }
}

function resetSettingsOnly() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, LAST_USED_SETTINGS)) {
            app.settings.saveSetting(SETTINGS_SECTION, LAST_USED_SETTINGS, "");
        }
        if (app.settings.haveSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS)) {
            app.settings.saveSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS, "");
        }
        if (app.settings.haveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX)) {
            app.settings.saveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX, "0");
        }
        return "success";
    } catch (e) {
        return "Error resetting settings: " + e.message;
    }
}

function resetEverything() {
    try {
        var settingsToRemove = [PYTHON_TOOL_PATH_SETTING, LAST_USED_SETTINGS, LAYERS_TO_PROCESS, CURRENT_LAYER_INDEX, LICENSE_VALID_SETTING, LICENSE_KEY_SETTING];
        for (var i = 0; i < settingsToRemove.length; i += 1) {
            try {
                if (app.settings.haveSetting(SETTINGS_SECTION, settingsToRemove[i])) {
                    app.settings.saveSetting(SETTINGS_SECTION, settingsToRemove[i], "");
                }
            } catch (e) {
            }
        }
        return "success";
    } catch (e) {
        return "Error resetting everything: " + e.message;
    }
}

function getExtensionStats() {
    try {
        var stats = {backendPath: "", hasBackend: getInitialState() === "true", settingsCount: 0, version: "2.1.0"};
        if (app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING)) {
            stats.backendPath = app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING);
        }
        var settingsToCheck = [LAST_USED_SETTINGS, LAYERS_TO_PROCESS, CURRENT_LAYER_INDEX];
        for (var i = 0; i < settingsToCheck.length; i += 1) {
            if (app.settings.haveSetting(SETTINGS_SECTION, settingsToCheck[i])) {
                var val = app.settings.getSetting(SETTINGS_SECTION, settingsToCheck[i]);
                if (((val) && (val !== "0")) && (val !== "")) {
                    stats.settingsCount++;
                }
            }
        }
        return JSON.stringify(stats);
    } catch (e) {
        return "{\"error\": \"" + e.message + "\"}";
    }
}

function cleanupTempFiles() {
    try {
        var cleaned = 0;
        var pythonToolPath = getPythonToolPath();
        if (pythonToolPath) {
            var tempFiles = ["progress.log", "captions.json", "process.lock", "cancel.flag"];
            for (var i = 0; i < tempFiles.length; i += 1) {
                try {
                    var file = new File(pythonToolPath + "/" + tempFiles[i]);
                    if (file.exists) {
                        file.remove();
                        cleaned++;
                    }
                } catch (e) {
                }
            }
        }
        return "Cleaned " + cleaned + " temporary files";
    } catch (e) {
        return "Error cleaning temp files: " + e.message;
    }
}

function resetSettingsOnly() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, LAST_USED_SETTINGS)) {
            app.settings.saveSetting(SETTINGS_SECTION, LAST_USED_SETTINGS, "");
        }
        if (app.settings.haveSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS)) {
            app.settings.saveSetting(SETTINGS_SECTION, LAYERS_TO_PROCESS, "");
        }
        if (app.settings.haveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX)) {
            app.settings.saveSetting(SETTINGS_SECTION, CURRENT_LAYER_INDEX, "0");
        }
        return "success";
    } catch (e) {
        return "Error resetting settings: " + e.message;
    }
}

function resetEverything() {
    try {
        var settingsToRemove = [PYTHON_TOOL_PATH_SETTING, LAST_USED_SETTINGS, LAYERS_TO_PROCESS, CURRENT_LAYER_INDEX];
        for (var i = 0; i < settingsToRemove.length; i += 1) {
            try {
                if (app.settings.haveSetting(SETTINGS_SECTION, settingsToRemove[i])) {
                    app.settings.saveSetting(SETTINGS_SECTION, settingsToRemove[i], "");
                }
            } catch (e) {
            }
        }
        return "success";
    } catch (e) {
        return "Error resetting everything: " + e.message;
    }
}

function getExtensionStats() {
    try {
        var stats = {backendPath: "", hasBackend: getInitialState() === "true", settingsCount: 0, version: "2.1.0"};
        if (app.settings.haveSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING)) {
            stats.backendPath = app.settings.getSetting(SETTINGS_SECTION, PYTHON_TOOL_PATH_SETTING);
        }
        var settingsToCheck = [LAST_USED_SETTINGS, LAYERS_TO_PROCESS, CURRENT_LAYER_INDEX];
        for (var i = 0; i < settingsToCheck.length; i += 1) {
            if (app.settings.haveSetting(SETTINGS_SECTION, settingsToCheck[i])) {
                var val = app.settings.getSetting(SETTINGS_SECTION, settingsToCheck[i]);
                if (((val) && (val !== "0")) && (val !== "")) {
                    stats.settingsCount++;
                }
            }
        }
        return JSON.stringify(stats);
    } catch (e) {
        return "{\"error\": \"" + e.message + "\"}";
    }
}

function cleanupTempFiles() {
    try {
        var cleaned = 0;
        var pythonToolPath = getPythonToolPath();
        if (pythonToolPath) {
            var tempFiles = ["progress.log", "captions.json", "process.lock", "cancel.flag"];
            for (var i = 0; i < tempFiles.length; i += 1) {
                try {
                    var file = new File(pythonToolPath + "/" + tempFiles[i]);
                    if (file.exists) {
                        file.remove();
                        cleaned++;
                    }
                } catch (e) {
                }
            }
        }
        return "Cleaned " + cleaned + " temporary files";
    } catch (e) {
        return "Error cleaning temp files: " + e.message;
    }
}

function saveLicenseState(isValid, licenseKey) {
    try {
        app.settings.saveSetting(SETTINGS_SECTION, LICENSE_VALID_SETTING, isValid);
        app.settings.saveSetting(SETTINGS_SECTION, LICENSE_KEY_SETTING, licenseKey);
    } catch (e) {
    }
}

function getLicenseState() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, LICENSE_VALID_SETTING)) {
            var isValid = app.settings.getSetting(SETTINGS_SECTION, LICENSE_VALID_SETTING);
            return isValid === "true" ? "true" : "false";
        }
    } catch (e) {
    }
    return "false";
}

function getLicenseKey() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, LICENSE_KEY_SETTING)) {
            return app.settings.getSetting(SETTINGS_SECTION, LICENSE_KEY_SETTING);
        }
    } catch (e) {
    }
    return "";
}

function getDeviceID() {
    try {
        if (app.settings.haveSetting(SETTINGS_SECTION, DEVICE_ID_SETTING)) {
            var deviceId = app.settings.getSetting(SETTINGS_SECTION, DEVICE_ID_SETTING);
            if ((deviceId) && (deviceId.length > 10)) {
                return deviceId;
            }
        }
        var newId = "";
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 24; i += 1) {
            newId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        app.settings.saveSetting(SETTINGS_SECTION, DEVICE_ID_SETTING, newId);
        return newId;
    } catch (e) {
        return "error-creating-id";
    }
}

var SETTINGS_SECTION = "MukeshFX_AutoCaption_v2";
var PYTHON_TOOL_PATH_SETTING = "pythonToolPath";
var LAST_USED_SETTINGS = "lastUsedSettings";
var LAYERS_TO_PROCESS = "layersToProcess";
var CURRENT_LAYER_INDEX = "currentLayerIndex";
var LICENSE_VALID_SETTING = "isLicenseValid";
var LICENSE_KEY_SETTING = "userLicenseKey";
var DEVICE_ID_SETTING = "deviceIdentifier";
