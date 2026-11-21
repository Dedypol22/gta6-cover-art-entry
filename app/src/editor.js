import { Renderer } from './renderer.js';

class Editor {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        this.renderer = new Renderer(this.canvas);
        
        this.state = {
            width: 1920,
            height: 1080,
            layout: 'trio',
            panels: [
                { photo: 'samples/pier.jpg', zoom: 1.5, posX: 0, posY: 0 },
                { photo: 'samples/boulevard.jpg', zoom: 1, posX: 0, posY: 0 },
                { photo: 'samples/pier.jpg', zoom: 1, posX: 0, posY: 0 }
            ],
            caption: {
                main: 'SUNSET HEIST',
                sub: 'VICE CITY • LEONIDA',
                color: '#FFFFFF',
                size: 1,
                position: 'bottom'
            },
            grade: 'sunset',
            gradeEnabled: true,
            activePanel: 0
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.handleUrlParams();
        await this.update();
    }

    setupEventListeners() {
        // Layouts
        document.querySelectorAll('[data-layout]').forEach(btn => {
            btn.onclick = () => {
                this.state.layout = btn.dataset.layout;
                this.updateUI();
                this.update();
            };
        });

        // Photo Upload
        document.getElementById('upload-btn').onclick = () => document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = (e) => this.handleFileUpload(e);

        // Samples
        document.querySelectorAll('[data-sample]').forEach(btn => {
            btn.onclick = () => {
                this.state.panels[this.state.activePanel].photo = `samples/${btn.dataset.sample}.jpg`;
                this.update();
            };
        });

        // Sliders
        const sliders = {
            'zoom-slider': 'zoom',
            'pos-x-slider': 'posX',
            'pos-y-slider': 'posY'
        };
        for (const [id, key] of Object.entries(sliders)) {
            document.getElementById(id).oninput = (e) => {
                this.state.panels[this.state.activePanel][key] = parseFloat(e.target.value);
                this.update();
            };
        }

        // Caption
        document.getElementById('caption-main').oninput = (e) => {
            this.state.caption.main = e.target.value.toUpperCase();
            this.update();
        };
        document.getElementById('caption-sub').oninput = (e) => {
            this.state.caption.sub = e.target.value.toUpperCase();
            this.update();
        };
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.onclick = () => {
                this.state.caption.color = btn.dataset.color;
                this.updateUI();
                this.update();
            };
        });
        document.getElementById('caption-size').oninput = (e) => {
            this.state.caption.size = parseFloat(e.target.value);
            this.update();
        };
        document.querySelectorAll('[data-pos]').forEach(btn => {
            btn.onclick = () => {
                this.state.caption.position = btn.dataset.pos;
                this.updateUI();
                this.update();
            };
        });

        // Grade
        document.querySelectorAll('[data-grade]').forEach(btn => {
            btn.onclick = () => {
                this.state.grade = btn.dataset.grade;
                this.updateUI();
                this.update();
            };
        });
        document.getElementById('grade-toggle').onchange = (e) => {
            this.state.gradeEnabled = e.target.checked;
            this.update();
        };

        // Export
        document.getElementById('export-size').onchange = (e) => {
            const [w, h] = e.target.value.split('x').map(Number);
            this.state.width = w;
            this.state.height = h;
            this.update();
        };
        document.getElementById('download-btn').onclick = () => this.download();

        // Canvas Interaction
        this.canvas.onclick = (e) => this.handleCanvasClick(e);
        this.setupDrag();
    }

    handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.state.panels[this.state.activePanel].photo = ev.target.result;
            this.update();
        };
        reader.readAsDataURL(files[0]);
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // Simple hit test for panels based on layout
        const layoutDef = this.renderer.getLayout(this.state.layout, 1, 1);
        for (let i = 0; i < layoutDef.length; i++) {
            const r = layoutDef[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                this.state.activePanel = i;
                this.updateUI();
                break;
            }
        }
    }

    setupDrag() {
        let isDragging = false;
        let lastX, lastY;

        this.canvas.onmousedown = (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        };

        window.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = (e.clientX - lastX) / this.canvas.offsetWidth;
            const dy = (e.clientY - lastY) / this.canvas.offsetHeight;
            
            this.state.panels[this.state.activePanel].posX += dx;
            this.state.panels[this.state.activePanel].posY += dy;
            
            lastX = e.clientX;
            lastY = e.clientY;
            this.update();
        };

        window.onmouseup = () => {
            isDragging = false;
            this.syncSliders();
        };
    }

    syncSliders() {
        const p = this.state.panels[this.state.activePanel];
        document.getElementById('zoom-slider').value = p.zoom;
        document.getElementById('pos-x-slider').value = p.posX;
        document.getElementById('pos-y-slider').value = p.posY;
    }

    handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const shot = params.get('shot');
        if (shot) {
            document.body.classList.add('shot-mode');
            if (params.get('layout')) this.state.layout = params.get('layout');
            if (params.get('grade')) this.state.grade = params.get('grade');
            if (params.get('caption')) this.state.caption.main = params.get('caption').toUpperCase();
            if (params.get('size')) {
                const [w, h] = params.get('size').split('x').map(Number);
                this.state.width = w;
                this.state.height = h;
            }
            if (params.get('photo')) {
                const photo = `samples/${params.get('photo')}.jpg`;
                this.state.panels.forEach(p => p.photo = photo);
            }
        }
    }

    updateUI() {
        document.querySelectorAll('[data-layout]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === this.state.layout);
        });
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.state.caption.color);
        });
        document.querySelectorAll('[data-pos]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pos === this.state.caption.position);
        });
        document.querySelectorAll('[data-grade]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.grade === this.state.grade);
        });
        this.syncSliders();
    }

    async update() {
        this.renderer.setState(this.state);
        await this.renderer.render();
    }

    download() {
        const link = document.createElement('a');
        link.download = `leonida-cover-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

new Editor();
