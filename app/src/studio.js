import { CoverRenderer } from './render.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cover-canvas');
    const renderer = new CoverRenderer(canvas);
    
    // UI Elements
    const photoInput = document.getElementById('photo-input');
    const titleInput = document.getElementById('title-input');
    const subtitleInput = document.getElementById('subtitle-input');
    const zoomSlider = document.getElementById('zoom-slider');
    const gradeToggle = document.getElementById('grade-toggle');
    const downloadBtn = document.getElementById('download-btn');
    const activePanelSpan = document.getElementById('active-panel-num');
    const panelControls = document.getElementById('panel-controls');

    let activePanelIndex = 0;
    let isDragging = false;
    let lastMousePos = { x: 0, y: 0 };

    // Initialize renderer size
    renderer.setSize(1920, 1080);

    // Layout buttons
    document.querySelectorAll('[data-layout]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-layout]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderer.setLayout(btn.dataset.layout);
            renderer.render();
        });
    });

    // Size buttons
    document.querySelectorAll('[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const [w, h] = btn.dataset.size.split('x').map(Number);
            renderer.setSize(w, h);
            renderer.render();
        });
    });

    // Caption inputs
    titleInput.addEventListener('input', () => {
        renderer.config.caption.title = titleInput.value.toUpperCase();
        renderer.render();
    });
    subtitleInput.addEventListener('input', () => {
        renderer.config.caption.subtitle = subtitleInput.value.toUpperCase();
        renderer.render();
    });

    // Caption position
    document.querySelectorAll('[data-pos]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-pos]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderer.config.caption.position = btn.dataset.pos;
            renderer.render();
        });
    });

    // Color buttons
    document.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderer.config.caption.color = btn.dataset.color;
            renderer.render();
        });
    });

    // Grade buttons
    document.querySelectorAll('[data-grade]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-grade]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderer.config.grade = btn.dataset.grade;
            renderer.render();
        });
    });

    gradeToggle.addEventListener('change', () => {
        renderer.config.showGrade = gradeToggle.checked;
        renderer.render();
    });

    // Photo Handling
    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const idx = (activePanelIndex + i) % 3;
                    renderer.setPanelImage(idx, img);
                    renderer.render();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    });

    const loadSample = (path, index) => {
        const img = new Image();
        img.onload = () => {
            renderer.setPanelImage(index, img);
            renderer.render();
        };
        img.src = path;
    };

    document.getElementById('sample-pier').addEventListener('click', () => loadSample('samples/pier.jpg', activePanelIndex));
    document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('samples/boulevard.jpg', activePanelIndex));

    // Panel Selection & Dragging
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Find which panel was clicked
        const layouts = renderer.getLayoutRects();
        layouts.forEach((r, i) => {
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                activePanelIndex = i;
                activePanelSpan.textContent = i + 1;
                panelControls.classList.remove('hidden');
                zoomSlider.value = renderer.config.panels[i].zoom;
                isDragging = true;
                lastMousePos = { x, y };
            }
        });
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        const dx = (x - lastMousePos.x) / canvas.width;
        const dy = (y - lastMousePos.y) / canvas.height;

        const panel = renderer.config.panels[activePanelIndex];
        panel.x += dx * 2;
        panel.y += dy * 2;

        lastMousePos = { x, y };
        renderer.render();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    zoomSlider.addEventListener('input', () => {
        renderer.config.panels[activePanelIndex].zoom = parseFloat(zoomSlider.value);
        renderer.render();
    });

    // Export
    downloadBtn.addEventListener('click', () => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gta6-cover-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    });

    // Screenshot Mode
    const params = new URLSearchParams(window.location.search);
    if (params.has('shot')) {
        document.getElementById('app').classList.remove('editor-mode');
        document.getElementById('app').classList.add('screenshot-mode');

        // Apply params
        if (params.has('layout')) renderer.setLayout(params.get('layout'));
        if (params.has('size')) {
            const [w, h] = params.get('size').split('x').map(Number);
            renderer.setSize(w, h);
        }
        if (params.has('caption')) renderer.config.caption.title = params.get('caption').toUpperCase();
        if (params.has('grade')) renderer.config.grade = params.get('grade');

        const photos = params.get('photo')?.split('|') || [];
        let loaded = 0;
        if (photos.length > 0) {
            photos.forEach((p, i) => {
                const img = new Image();
                img.onload = () => {
                    renderer.setPanelImage(i, img);
                    loaded++;
                    if (loaded === photos.length) renderer.render();
                };
                img.src = `samples/${p}.jpg`;
            });
        } else {
            renderer.render();
        }

        if (params.get('shot') === 'editor') {
            document.getElementById('app').classList.add('editor-mode');
            document.getElementById('app').classList.remove('screenshot-mode');
        }
    } else {
        renderer.render();
    }
});
