export class CoverRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = {
            layout: 'trio',
            size: { width: 1920, height: 1080 },
            panels: [
                { id: 0, image: null, zoom: 1, x: 0.5, y: 0.5 },
                { id: 1, image: null, zoom: 1, x: 0.5, y: 0.5 },
                { id: 2, image: null, zoom: 1, x: 0.5, y: 0.5 }
            ],
            caption: {
                title: 'SUNSET HEIST',
                subtitle: 'VICE CITY • LEONIDA',
                position: 'bottom',
                color: 'white'
            },
            grade: 'sunset',
            showGrade: true
        };
    }

    setSize(width, height) {
        this.config.size = { width, height };
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setLayout(layout) {
        this.config.layout = layout;
    }

    setPanelImage(index, img) {
        if (this.config.panels[index]) {
            this.config.panels[index].image = img;
        }
    }

    updatePanel(index, data) {
        if (this.config.panels[index]) {
            Object.assign(this.config.panels[index], data);
        }
    }

    render() {
        const { width, height } = this.config.size;
        this.ctx.clearRect(0, 0, width, height);

        // Draw Panels
        const layout = this.getLayoutRects();
        layout.forEach((rect, i) => {
            this.drawPanel(rect, this.config.panels[i]);
        });

        // Draw Borders
        this.drawBorders(layout);

        // Draw Caption
        this.drawCaption();

        // Apply Color Grade
        if (this.config.showGrade) {
            this.applyColorGrade();
        }
    }

    getLayoutRects() {
        const { width, height } = this.config.size;
        const gap = 10;
        if (this.config.layout === 'solo') {
            return [{ x: 0, y: 0, w: width, h: height }];
        } else if (this.config.layout === 'duo') {
            return [
                { x: 0, y: 0, w: width / 2 - gap / 2, h: height },
                { x: width / 2 + gap / 2, y: 0, w: width / 2 - gap / 2, h: height }
            ];
        } else { // trio
            return [
                { x: 0, y: 0, w: width, h: height * 0.6 - gap / 2 },
                { x: 0, y: height * 0.6 + gap / 2, w: width / 2 - gap / 2, h: height * 0.4 - gap / 2 },
                { x: width / 2 + gap / 2, y: height * 0.6 + gap / 2, w: width / 2 - gap / 2, h: height * 0.4 - gap / 2 }
            ];
        }
    }

    drawPanel(rect, panel) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.clip();

        if (panel && panel.image) {
            const img = panel.image;
            const iw = img.width;
            const ih = img.height;
            const aspect = rect.w / rect.h;
            const imgAspect = iw / ih;

            let renderW, renderH;
            if (imgAspect > aspect) {
                renderH = rect.h * panel.zoom;
                renderW = renderH * imgAspect;
            } else {
                renderW = rect.w * panel.zoom;
                renderH = renderW / imgAspect;
            }

            const x = rect.x + rect.w * panel.x - renderW / 2;
            const y = rect.y + rect.h * panel.y - renderH / 2;

            this.ctx.drawImage(img, x, y, renderW, renderH);
        } else {
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
        this.ctx.restore();
    }

    drawBorders(layout) {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 8;
        layout.forEach(rect => {
            this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        });
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCaption() {
        const { title, subtitle, position, color } = this.config.caption;
        const { width, height } = this.config.size;

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const yBase = position === 'top' ? height * 0.2 : height * 0.8;
        
        // Title
        const titleSize = height * 0.15;
        this.ctx.font = `italic 900 ${titleSize}px 'Arial Narrow', Impact, sans-serif`;
        this.ctx.letterSpacing = (titleSize * 0.05) + 'px';
        
        // Shadow & Outline
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        this.ctx.lineWidth = titleSize * 0.12;
        this.ctx.strokeStyle = 'black';
        this.ctx.strokeText(title, width / 2, yBase);

        this.ctx.fillStyle = color;
        this.ctx.fillText(title, width / 2, yBase);

        // Subtitle
        const subSize = titleSize * 0.25;
        this.ctx.font = `italic 700 ${subSize}px 'Arial Narrow', Impact, sans-serif`;
        this.ctx.letterSpacing = (subSize * 0.2) + 'px';
        
        const subY = yBase + titleSize * 0.6;
        this.ctx.lineWidth = subSize * 0.2;
        this.ctx.strokeText(subtitle, width / 2, subY);
        this.ctx.fillText(subtitle, width / 2, subY);

        this.ctx.restore();
    }

    applyColorGrade() {
        const { width, height } = this.config.size;
        const grade = this.config.grade;

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';

        let gradient;
        if (grade === 'sunset') {
            gradient = this.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 150, 0.2)');
            gradient.addColorStop(1, 'rgba(100, 0, 200, 0.3)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);

            this.ctx.globalCompositeOperation = 'soft-light';
            this.ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
            this.ctx.fillRect(0, 0, width, height);
        } else if (grade === 'neon') {
            gradient = this.ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
            
            this.ctx.globalCompositeOperation = 'multiply';
            const vignette = this.ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width*0.8);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
            this.ctx.fillStyle = vignette;
            this.ctx.fillRect(0, 0, width, height);
        } else if (grade === 'malam') {
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = 'rgba(0, 20, 100, 0.4)';
            this.ctx.fillRect(0, 0, width, height);
            
            this.ctx.globalCompositeOperation = 'screen';
            gradient = this.ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.2)');
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
        }

        this.ctx.restore();
    }
}
