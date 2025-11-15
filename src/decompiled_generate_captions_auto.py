# idc about this file it need to be fixed after decompiling. This is for someone who wanna see how backend approx works
# And sometimes extension doest work, to fix that need to clean all files, except "caption-backend.exe" in "Toolkit" folder

global _LAST_FLUSH
import sys
import os
import json
import subprocess
import time
import shutil
import stat
from tempfile import NamedTemporaryFile
import traceback
_LAST_FLUSH = 0.0
def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)
def _now():
    return time.time()
def update_progress(process_dir, message, force_fsync=False):
    """Update progress with immediate flush; fsync throttled unless forced."""
    global _LAST_FLUSH
    try:
        progress_file_path = os.path.join(process_dir, 'progress.log')
        with open(progress_file_path, 'w', encoding='utf-8') as f:
            f.write(message)
            f.flush()
            if force_fsync or _now() - _LAST_FLUSH >= 1.0:
                try:
                    os.fsync(f.fileno())
                except Exception:
                    pass
            _LAST_FLUSH = _now()
        print(message)
        sys.stdout.flush()
    except Exception:
        return None
def find_ffmpeg():
    """Find FFmpeg executable with OS detection"""
    if os.name == 'nt':
        ff = get_resource_path('bin/ffmpeg.exe')
    else:
        ff = get_resource_path('bin/ffmpeg')
    if os.path.exists(ff):
        if os.name!= 'nt':
            try:
                st = os.stat(ff).st_mode
                os.chmod(ff, st | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
            except Exception:
                pass
            return ff
    else:
        sys_ff = shutil.which('ffmpeg')
        return sys_ff or ff
def get_video_fps(video_path):
    # irreducible cflow, using cdg fallback
    """Get actual video frame rate using ffprobe"""
    ffprobe = shutil.which('ffprobe')
    if not ffprobe:
        ffprobe = get_resource_path('bin/ffprobe.exe' if os.name == 'nt' else 'bin/ffprobe')
    if ffprobe and os.path.exists(ffprobe):
        cmd = [ffprobe, '-v', 'quiet', '-print_format', 'json', '-show_streams', '-select_streams', 'v:0', video_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            streams = data.get('streams', [])
            if streams:
                fps_str = streams[0].get('r_frame_rate', '30/1')
                if '/' in fps_str:
                    num, den = fps_str.split('/')
                    return float(num) / float(den)
                    return float(fps_str)
                        except Exception:
                                return None
def detect_apple_silicon():
    """Check if running on Apple Silicon"""
    try:
        import platform
        arch = platform.machine()
        return arch in ('arm64', 'aarch64')
    except Exception:
        return False
def get_cpu_count():
    # irreducible cflow, using cdg fallback
    """Get CPU count with multiple fallbacks"""
    import psutil
    return psutil.cpu_count()
        except ImportError:
                import multiprocessing
                return multiprocessing.cpu_count()
                    except Exception:
                        return os.cpu_count() or 4
def get_optimal_device_and_threads(process_dir):
    # irreducible cflow, using cdg fallback
    """Get optimal device settings - GPU FIRST priority, especially on Windows"""
    device_info = {'device': 'cpu', 'cpu_threads': 4, 'compute_type': 'int8', 'name': 'CPU', 'details': 'Standard CPU'}
    update_progress(process_dir, 'DEBUG: Checking for NVIDIA GPU...')
    import torch
    if torch.cuda.is_available():
        test_tensor = torch.randn(100, 100).cuda()
        _ = test_tensor @ test_tensor
        del test_tensor
        torch.cuda.empty_cache()
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1073741824
        device_info.update({'device': 'cuda', 'cpu_threads': 4, 'compute_type': 'float16', 'name': 'GPU (CUDA)', 'details': '{} ({:.1f}GB VRAM)'.format(gpu_name, vram_gb)})
        update_progress(process_dir, '✅ NVIDIA GPU detected and tested successfully!')
        return device_info
                    is_apple_silicon = detect_apple_silicon()
                    update_progress(process_dir, 'DEBUG: Apple Silicon check: {}'.format(is_apple_silicon))
                    if is_apple_silicon:
                        try:
                            cpu_count = get_cpu_count()
                            optimal_threads = min(cpu_count, 8)
                            update_progress(process_dir, 'DEBUG: Apple Silicon - CPU count: {}, using {} threads'.format(cpu_count, optimal_threads))
                            device_info.update({'device': 'cpu', 'cpu_threads': optimal_threads, 'compute_type': 'int8', 'name': 'CPU (Apple Silicon Optimized)', 'details': 'M-series chip with {} threads'.format(optimal_threads)})
                            update_progress(process_dir, '✅ Apple Silicon optimization applied')
                            return device_info
                        except Exception as apple_error:
                            update_progress(process_dir, 'DEBUG: Apple Silicon optimization failed: {}'.format(str(apple_error)))
                        else:
                            pass
                    cpu_count = get_cpu_count()
                    optimal_threads = min(cpu_count // 2, 6)
                    is_windows = os.name == 'nt'
                    if is_windows:
                        optimal_threads = min(cpu_count, 8)
                        device_info.update({'cpu_threads': optimal_threads, 'compute_type': 'int8', 'name': 'CPU (Windows Optimized)', 'details': 'Windows PC - {} cores, {} threads'.format(cpu_count, optimal_threads)})
                        update_progress(process_dir, 'ℹ️ Windows CPU optimization applied')
                            return device_info
                        device_info.update({'cpu_threads': optimal_threads, 'details': '{} cores, {} threads'.format(cpu_count, optimal_threads)})
                        update_progress(process_dir, 'ℹ️ Standard CPU optimization applied')
                            return device_info
            except ImportError:
                update_progress(process_dir, 'DEBUG: PyTorch not available for GPU detection')
                except Exception as cuda_error:
                        update_progress(process_dir, 'DEBUG: CUDA test failed: {}'.format(str(cuda_error)[:100]))
                            except Exception:
                                update_progress(process_dir, 'DEBUG: Using basic CPU settings')
def load_whisper_model(model_path, device_info, process_dir):
    """Load WhisperModel with device-specific optimizations"""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise RuntimeError('faster-whisper not installed. Run: pip install faster-whisper')
    device = device_info['device']
    cpu_threads = device_info['cpu_threads']
    compute_type = device_info['compute_type']
    update_progress(process_dir, 'DEBUG: Loading model - device: {}, threads: {}, compute: {}'.format(device, cpu_threads, compute_type))
    if device == 'cuda':
        model = WhisperModel(model_path, device='cuda', compute_type=compute_type, cpu_threads=cpu_threads)
    else:
        model = WhisperModel(model_path, device='cpu', compute_type=compute_type, cpu_threads=cpu_threads, num_workers=1)
    update_progress(process_dir, 'DEBUG: Model loaded successfully')
    return model
def summarize_exception(e):
    return '{}: {}'.format(type(e).__name__, str(e))
def run():
    # irreducible cflow, using cdg fallback
    if len(sys.argv)!= 15:
        update_progress(process_dir=sys.argv[1] if len(sys.argv) > 1 else '.', message='FATAL ERROR: Wrong arg count. Expected 14, got {}. Args: {}'.format(len(sys.argv) - 1, sys.argv[1:]), force_fsync=True)
        sys.exit(1)
    process_dir = sys.argv[1]
    lock_file_path = os.path.join(process_dir, 'process.lock')
    cancel_file = os.path.join(process_dir, 'cancel.flag')
    run_start_time = time.time()
    def was_cancelled_now():
        try:
            return os.path.exists(cancel_file) and os.path.getmtime(cancel_file) >= run_start_time - 0.1
        except Exception:
            return os.path.exists(cancel_file)
    with open(lock_file_path, 'w') as f:
        f.write('running')
    video_path = sys.argv[2]
    max_chars = int(sys.argv[3])
    max_duration = float(sys.argv[4])
    gap_frames = int(sys.argv[5])
    line_mode = sys.argv[6]
    source_start_time = float(sys.argv[7])
    trim_duration = float(sys.argv[8])
    language = sys.argv[9]
    model_size = sys.argv[10]
    export_srt = sys.argv[11].lower() == 'true'
    srt_path = sys.argv[12]
    try:
        source_fps = float(sys.argv[13])
        if source_fps <= 0:
            source_fps = 30.0
    except (ValueError, IndexError):
        source_fps = 30.0
    task_type = sys.argv[14]
    update_progress(process_dir, 'DEBUG: Starting transcription - model: {}, task: {}, fps: {:.3f}'.format(model_size, task_type, source_fps))
    if was_cancelled_now():
        os.remove(cancel_file)
            raise RuntimeError('Process cancelled by user')
        detected_fps = get_video_fps(video_path)
        if detected_fps and abs(detected_fps - source_fps) > 0.1:
                update_progress(process_dir, 'INFO: FPS mismatch - AE reports {:.3f}fps, file is {:.3f}fps. Using AE value for timing alignment.'.format(source_fps, detected_fps))
        gap_threshold = float(gap_frames) / source_fps
        update_progress(process_dir, 'DEBUG: Using {:.3f}fps, gap threshold: {:.3f}s ({} frames)'.format(source_fps, gap_threshold, gap_frames))
        ffmpeg_executable = find_ffmpeg()
        if not os.path.exists(ffmpeg_executable):
            raise RuntimeError('FFmpeg not found. Checked bundled and system PATH.')
        else:
            update_progress(process_dir, 'PROGRESS: 1/5 - Preparing audio...', force_fsync=True)
            if not os.path.exists(video_path):
                raise RuntimeError('Video file not found: {}'.format(video_path))
            else:
                if os.path.getsize(video_path) < 1024:
                    raise RuntimeError('Video file is too small or empty: {}'.format(video_path))
                else:
                    def probe_video_info(video_path):
                        # irreducible cflow, using cdg fallback
                        ffprobe = shutil.which('ffprobe')
                        if not ffprobe:
                            ffprobe = get_resource_path('bin/ffprobe.exe' if os.name == 'nt' else 'bin/ffprobe')
                        if ffprobe and os.path.exists(ffprobe):
                            cmd = [ffprobe, '-v', 'quiet', '-print_format', 'json', '-show_streams', video_path]
                            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
                            if result.returncode == 0:
                                data = json.loads(result.stdout)
                                streams = data.get('streams', [])
                                video_duration = None
                                has_audio = False
                                audio_codec = None
                                for stream in streams:
                                    if stream.get('codec_type') == 'video' and stream.get('duration'):
                                        video_duration = float(stream['duration'])
                                    else:
                                        if stream.get('codec_type') == 'audio':
                                            has_audio = True
                                            audio_codec = stream.get('codec_name', 'unknown')
                                return {'duration': video_duration, 'has_audio': has_audio, 'audio_codec': audio_codec}
                                except Exception as e:
                                        update_progress(process_dir, 'DEBUG: Probe failed: {}'.format(str(e)))
                    video_info = probe_video_info(video_path)
                    if video_info:
                        update_progress(process_dir, 'DEBUG: Video duration: {:.1f}s, has audio: {}, codec: {}'.format(video_info.get('duration', 0), video_info.get('has_audio', False), video_info.get('audio_codec', 'none')))
                        if not video_info.get('has_audio', False):
                            raise RuntimeError('Video file has no audio stream. Cannot generate captions.')
                        else:
                            video_duration = video_info.get('duration', 0)
                            if video_duration and source_start_time >= video_duration:
                                raise RuntimeError('Start time ({:.1f}s) is beyond video duration ({:.1f}s)'.format(source_start_time, video_duration))
                            else:
                                if video_duration and source_start_time + trim_duration > video_duration:
                                        actual_duration = video_duration - source_start_time
                                        update_progress(process_dir, 'WARNING: Trim duration adjusted from {:.1f}s to {:.1f}s (video end)'.format(trim_duration, actual_duration))
                                        trim_duration = max(1.0, actual_duration)
                    with NamedTemporaryFile(suffix='.wav', delete=False, dir=process_dir) as temp_file:
                        audio_path = temp_file.name
                    ffmpeg_audio_cmd = [ffmpeg_executable, '-y', '-ss', str(source_start_time), '-i', video_path, '-t', str(trim_duration), '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', '-threads', '0', '-loglevel', 'error', audio_path]
                    update_progress(process_dir, 'DEBUG: FFmpeg command: {}'.format(' '.join(['\"{}\"'.format(arg) if ' ' in arg else arg for arg in ffmpeg_audio_cmd])))
        try:
            process = subprocess.Popen(ffmpeg_audio_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, universal_newlines=True)
            stderr_output = []
            last_update = 0.0
            while True:
                if was_cancelled_now():
                    try:
                        process.terminate()
                    except Exception:
                        pass
                    try:
                        os.remove(cancel_file)
                    except Exception:
                        pass
                    raise RuntimeError('Process cancelled by user')
                output = process.stderr.readline()
                if output == '' and process.poll() is not None:
                    return_code = process.poll()
                    if return_code!= 0:
                        error_details = '\n'.join(stderr_output[(-10):])
                        if 'No such file or directory' in error_details:
                            raise RuntimeError('FFmpeg cannot find the video file. Check the file path: {}'.format(video_path))
                        else:
                            if 'Invalid data found when processing input' in error_details:
                                raise RuntimeError('Video file appears to be corrupted or in an unsupported format.')
                            else:
                                if 'does not contain any stream' in error_details:
                                    raise RuntimeError('Video file contains no usable streams.')
                                else:
                                    if 'Permission denied' in error_details:
                                        raise RuntimeError('FFmpeg permission denied. Check file permissions and available disk space.')
                                    else:
                                        if 'Protocol not found' in error_details:
                                            raise RuntimeError('FFmpeg cannot handle this video format or location.')
                                        else:
                                            raise RuntimeError('Audio extraction failed (exit code {}). FFmpeg error: {}'.format(return_code, error_details or 'Unknown error'))
                else:
                    if output:
                        stderr_output.append(output.strip())
                        if 'time=' in output and _now() - last_update >= 0.5:
                                update_progress(process_dir, 'PROGRESS: 1/5 - Converting audio...')
                                last_update = _now()
                    continue
        except subprocess.CalledProcessError as ffmpeg_error:
            raise RuntimeError('Audio extraction failed with exit code {}'.format(ffmpeg_error.returncode))
        except Exception as e:
            if 'Process cancelled by user' in str(e):
                raise
            else:
                raise RuntimeError('Audio extraction error: {}'.format(str(e)))
        if not os.path.exists(audio_path):
            raise RuntimeError('Audio extraction failed: output file was not created.')
        audio_size = os.path.getsize(audio_path)
        if audio_size < 1024:
            raise RuntimeError('Audio extraction failed: output file is too small ({} bytes).'.format(audio_size))
        update_progress(process_dir, 'DEBUG: Audio extracted successfully ({:.1f} KB)'.format(audio_size / 1024))
        model_path = get_resource_path('models-{}'.format(model_size))
        if not os.path.exists(model_path):
            raise RuntimeError('Model \'{}\' not found at: {}'.format(model_size, model_path))
        device_info = get_optimal_device_and_threads(process_dir)
        try:
            model = load_whisper_model(model_path, device_info, process_dir)
            update_progress(process_dir, 'INFO: Using {} - Model: {} - {}'.format(device_info['name'], model_size, device_info['details']), force_fsync=True)
        except Exception as model_error:
            update_progress(process_dir, 'WARNING: Advanced loading failed, forcing CPU: {}'.format(str(model_error)[:100]))
            from faster_whisper import WhisperModel
            model = WhisperModel(model_path, device='cpu', compute_type='int8')
            update_progress(process_dir, 'INFO: Using CPU fallback - Model: {}'.format(model_size), force_fsync=True)
        update_progress(process_dir, 'PROGRESS: 3/5 - Preparing transcription...')
        if was_cancelled_now():
            os.remove(cancel_file)
                raise RuntimeError('Process cancelled by user')
            transcribe_options = {'task': task_type, 'word_timestamps': True, 'temperature': 0.0, 'compression_ratio_threshold': 2.4, 'no_speech_threshold': 0.6}
            if language!= 'auto':
                transcribe_options['language'] = language
            update_progress(process_dir, 'PROGRESS: 4/5 - Transcribing audio...', force_fsync=True)
            try:
                segments, info = model.transcribe(audio_path, **transcribe_options)
            except Exception as transcribe_error:
                update_progress(process_dir, 'WARNING: Transcription failed, retrying with conservative settings...')
                conservative_options = {'task': task_type, 'word_timestamps': False, 'temperature': 0.0}
                if language!= 'auto':
                    conservative_options['language'] = language
                segments, info = model.transcribe(audio_path, **conservative_options)
            detected_lang = getattr(info, 'language', 'unknown')
            lang_confidence = getattr(info, 'language_probability', 0.0)
            update_progress(process_dir, 'INFO: Detected \'{}\' (confidence: {:.2f})'.format(detected_lang, lang_confidence))
            update_progress(process_dir, 'PROGRESS: 5/5 - Formatting results...')
            result = {'segments': []}
            all_segments = []
            segment_count = 0
            for segment in segments:
                    if was_cancelled_now():
                        os.remove(cancel_file)
                            raise RuntimeError('Process cancelled by user')
                        words = []
                        words = [{'word': w.word, 'start': w.start, 'end': w.end} for w in segment.words] if hasattr(segment, 'words') and segment.words is not None else None
                        all_segments.append({'text': segment.text, 'start': segment.start, 'end': segment.end, 'words': words})
                        segment_count += 1
                        if segment_count % 5 == 0:
                            update_progress(process_dir, 'PROGRESS: 5/5 - Processing segment {}...'.format(segment_count))
                    def format_smart_caption(text, lang):
                        ws = text.split()
                        if len(ws) < 4:
                            return text
                        else:
                            if str(lang).startswith('hi') or str(lang) == 'hinglish':
                                pause_words = {'maine', 'ha', 'fir', 'or', 'par', 'ha', 'hain', 'lekin', 'phir', 'hona', 'ta', 'agar', 'hota', 'bhi', 'thi', 'maine', 'waise', 'ha', 'kyuki', 'matlab', 'chalo', 'but', 'lekin', 'kya', 'and', 'kyuki', 'kya', 'ya', 'bhi', 'maine', 'lekin', 'ho', 'kyuki', 'fir', 'bhi', 'ke', 'and'}
                            else:
                                whatever = {'and', 'and', 'moreover', 'thus', 'kind of', 'if', 'moreover', 'with', 'moreover', 'if', 'now', 'earlier', 'frankly', 'moreover', 'frankly', 'earlier', 'frankly', 'moreover', 'frankly', 'though', 'well', 'that', 'frankly', 'earlier', 'frankly', 'frankly', 'frankly', 'earlier', 'frankly', 'frankly', 'over', 'although', 'though', 'though', 'though', 'though', 'well', 'though', 'frankly', 'over', 'though', 'well', 'though', 'frankly', 'over', 'though', 'well', 'though', 'well', 'although', 'though', 'well', '
                            mid_point = len(ws) // 2
                            best_break_index = (-1)
                            for i in range(mid_point, min(mid_point + 3, len(ws) - 1)):
                                word_clean = ws[i].lower().strip('.,!?;:')
                                if word_clean in pause_words:
                                    best_break_index = i
                                    break
                            if best_break_index == (-1):
                                for i in range(mid_point - 1, max(mid_point - 4, 0), (-1)):
                                    word_clean = ws[i].lower().strip('.,!?;:')
                                    if word_clean in pause_words:
                                        best_break_index = i
                                        break
                            if best_break_index!= (-1):
                                return ' '.join(ws[:best_break_index + 1]) + '\r' + ' '.join(ws[best_break_index + 1:])
                            else:
                                return ' '.join(ws[:mid_point]) + '\r' + ' '.join(ws[mid_point:])
                    def process_words_with_gap(whisper_result, max_chars, max_duration, gap_threshold, line_mode, source_fps, language='en'):
                        """Process words into captions with accurate gap detection using source FPS"""
                        all_words = []
                        for seg in whisper_result.get('segments', []):
                            words = seg.get('words', [])
                            if not words and seg.get('text'):
                                    words = [{'word': seg['text'].strip(), 'start': seg['start'], 'end': seg['end']}]
                            all_words.extend(words)
                        if not all_words:
                            return []
                        else:
                            captions = []
                            current_caption_text = ''
                            caption_start_time = 0.0
                            last_word_end = 0.0
                            def smart_format_caption(text, lang):
                                if line_mode == 'single':
                                    return text.replace('\r', ' ').replace('\n', ' ')
                                else:
                                    if line_mode == 'double':
                                        ws = text.split()
                                        if len(ws) <= 2:
                                            return text
                                        else:
                                            mid = len(ws) // 2
                                            return ' '.join(ws[:mid]) + '\r' + ' '.join(ws[mid:])
                                    else:
                                        return format_smart_caption(text, lang)
                            def flush_caption(end_time):
                                nonlocal current_caption_text
                                nonlocal caption_start_time
                                if current_caption_text:
                                    text_to_format = current_caption_text.strip()
                                    formatted_text = smart_format_caption(text_to_format, language)
                                    captions.append({'text': formatted_text, 'start': round(caption_start_time, 3), 'end': round(end_time, 3)})
                                    current_caption_text, caption_start_time = ('', 0.0)
                            for i, word_data in enumerate(all_words):
                                word = (word_data.get('word') or '').strip()
                                word_start = float(word_data.get('start', 0.0))
                                word_end = float(word_data.get('end', word_start + 0.1))
                                if not word:
                                    continue
                                else:
                                    if i > 0 and word_start - last_word_end > gap_threshold:
                                            flush_caption(last_word_end)
                                    if not current_caption_text:
                                        current_caption_text = word
                                        caption_start_time = word_start
                                    else:
                                        potential_text = current_caption_text + ' ' + word
                                        if len(potential_text) > max_chars or word_end - caption_start_time > max_duration:
                                            flush_caption(last_word_end)
                                            current_caption_text = word
                                            caption_start_time = word_start
                                        else:
                                            current_caption_text += ' ' + word
                                    last_word_end = word_end
                            if current_caption_text:
                                flush_caption(last_word_end)
                            return captions
                    def build_captions_from_segments(all_segments, max_chars, max_duration, line_mode, lang):
                        caps = []
                        for seg in all_segments:
                            text = (seg.get('text') or '').strip()
                            if not text:
                                continue
                            else:
                                start = float(seg.get('start', 0.0))
                                end = float(seg.get('end', start + 0.1))
                                dur = max(0.0, end - start)
                                words = text.split()
                                if not words:
                                    continue
                                else:
                                    per_word = dur / max(1, len(words))
                                    buf, buf_start, buf_time = ([], start, start)
                                    def format_block(t):
                                        if line_mode == 'single':
                                            return t
                                        else:
                                            if line_mode == 'double':
                                                return t.replace(' ', '\r', 1) if ' ' in t else t
                                            else:
                                                return format_smart_caption(t, lang)
                                    for i, w in enumerate(words):
                                        next_time = start + (i + 1) * per_word
                                        candidate = (' '.join(buf) + ' ' + w).strip()
                                        if len(candidate) > max_chars or next_time - buf_start > max_duration:
                                            if buf:
                                                t = ' '.join(buf)
                                                caps.append({'text': format_block(t), 'start': round(buf_start, 3), 'end': round(buf_time, 3)})
                                            buf = [w]
                                            buf_start = buf_time
                                        else:
                                            buf.append(w)
                                        buf_time = next_time
                                    if buf:
                                        t = ' '.join(buf)
                                        caps.append({'text': format_block(t), 'start': round(buf_start, 3), 'end': round(min(end, buf_time), 3)})
                        return caps
                    result['segments'] = all_segments
                    has_enough_words = False
                    try:
                        all_words_flat = []
                        for seg in all_segments:
                            ws = seg.get('words') or []
                            all_words_flat.extend(ws)
                        has_enough_words = len(all_words_flat) >= 2
                    except Exception:
                        has_enough_words = False
                    if not all_segments:
                        captions = []
                    else:
                        if has_enough_words:
                            captions = process_words_with_gap(result, max_chars, max_duration, gap_threshold, line_mode, source_fps, detected_lang)
                            if not captions:
                                captions = build_captions_from_segments(all_segments, max_chars, max_duration, line_mode, detected_lang)
                        else:
                            captions = build_captions_from_segments(all_segments, max_chars, max_duration, line_mode, detected_lang)
                    json_path = os.path.join(process_dir, 'captions.json')
                    with open(json_path, 'w', encoding='utf-8') as f:
                        json.dump(captions, f, ensure_ascii=False, separators=(',', ':'))
                        f.flush()
                        try:
                            os.fsync(f.fileno())
                        except Exception:
                            pass
                    if export_srt and captions:
                            save_srt(captions, srt_path)
                    try:
                        if device_info['device'] == 'cuda':
                            import torch
                            torch.cuda.empty_cache()
                    except Exception:
                        pass
                    update_progress(process_dir, 'SUCCESS: {} captions generated using {:.3f}fps timing on {}.'.format(len(captions), source_fps, device_info['name']), force_fsync=True)
                                try:
                                    if os.path.exists(lock_file_path):
                                        os.remove(lock_file_path)
                                except Exception:
                                    pass
                                try:
                                    if os.path.exists(cancel_file):
                                        os.remove(cancel_file)
                                except Exception:
                                    pass
                                if 'audio_path' in locals() and audio_path and os.path.exists(audio_path):
                                            os.remove(audio_path)
            except Exception:
                    pass
                except Exception:
                        pass
                            except Exception:
                                pass
                except Exception as e:
                        error_message = 'FATAL ERROR: {}\n{}'.format(summarize_exception(e), traceback.format_exc())
                        update_progress(process_dir, error_message, force_fsync=True)
                        sys.exit(1)
                                                except Exception:
                                                        return
                                            try:
                                                pass
                                            else:
                                                pass
def save_srt(captions, srt_path):
    # irreducible cflow, using cdg fallback
    """Save captions as SRT file"""
    with open(srt_path, 'w', encoding='utf-8') as f:
        for i, cap in enumerate(captions, 1):
            start = format_srt_time(cap['start'])
            end = format_srt_time(cap['end'])
            text = cap['text'].replace('\r', '\n')
            f.write('{}\n{} --> {}\n{}\n\n'.format(i, start, end, text))
        f.flush()
        try:
            os.fsync(f.fileno())
        except Exception:
            pass
        except Exception as e:
                raise RuntimeError('Failed to save SRT file: {}'.format(str(e)))
def format_srt_time(seconds_float):
    """Format seconds as SRT timestamp (HH:MM:SS,mmm)"""
    total_seconds = int(seconds_float)
    milliseconds = int((seconds_float - total_seconds) * 1000)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return '{:02d}:{:02d}:{:02d},{:03d}'.format(hours, minutes, seconds, milliseconds)
if __name__ == '__main__':
    run()
