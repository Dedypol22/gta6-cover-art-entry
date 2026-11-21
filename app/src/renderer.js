export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = null;
        this.images = {}; // cache images
    }

    setState(state) {
        this.state = state;
    }

    async loadImage(id, src) {
        if (this.images[src]) return this.images[src];
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[src] = img;
                resolve(img);
            };
            img.src = src;
        });
    }

    async render() {
        if (!this.state) return;

        const { width, height, layout, panels, caption, grade, gradeEnabled } = this.state;
        this.canvas.width = width;
        this.canvas.height = height;

        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, width, height);

        // Draw Panels
        const layoutDef = this.getLayout(layout, width, height);
        for (let i = 0; i < layoutDef.length; i++) {
            const rect = layoutDef[i];
            const panelState = panels[i] || {};
            const photo = panelState.photo || '';
            
            if (photo) {
                const img = await this.loadImage(i, photo);
                this.drawPanelImage(img, rect, panelState);
            } else {
                this.ctx.fillStyle = '#222';
                this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            }
        }

        // Grade Warna
        if (gradeEnabled) {
            this.applyGrade(grade, width, height);
        }

        // Frame
        this.drawFrame(layoutDef, width, height);

        // Caption
        this.drawCaption(caption, width, height);
    }

    getLayout(type, w, h) {
        const gap = 10; // line thickness
        if (type === 'solo') {
            return [{ x: 0, y: 0, w, h }];
        } else if (type === 'duo') {
            return [
                { x: 0, y: 0, w: w / 2 - gap / 2, h },
                { x: w / 2 + gap / 2, y: 0, w: w / 2 - gap / 2, h }
            ];
        } else { // trio
            const splitY = h * 0.6;
            return [
                { x: 0, y: 0, w, h: splitY - gap / 2 },
                { x: 0, y: splitY + gap / 2, w: w / 2 - gap / 2, h: h - splitY - gap / 2 },
                { x: w / 2 + gap / 2, y: splitY + gap / 2, w: w / 2 - gap / 2, h: h - splitY - gap / 2 }
            ];
        }
    }

    drawPanelImage(img, rect, state) {
        const { zoom = 1, posX = 0, posY = 0 } = state;
        const { ctx } = this;

        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();

        const imgRatio = img.width / img.height;
        const rectRatio = rect.w / rect.h;

        let drawW, drawH;
        if (imgRatio > rectRatio) {
            drawH = rect.h * zoom;
            drawW = drawH * imgRatio;
        } else {
            drawW = rect.w * zoom;
            drawH = drawW / imgRatio;
        }

        const x = rect.x + (rect.w - drawW) / 2 + (posX * rect.w);
        const y = rect.y + (rect.h - drawH) / 2 + (posY * rect.h);

        ctx.drawImage(img, x, y, drawW, drawH);
        ctx.restore();
    }

    applyGrade(grade, w, h) {
        const { ctx } = this;
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';

        let grad;
        if (grade === 'sunset') {
            grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, 'rgba(255, 100, 50, 0.3)');
            grad.addColorStop(0.5, 'rgba(255, 50, 150, 0.2)');
            grad.addColorStop(1, 'rgba(100, 0, 100, 0.3)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
            ctx.fillRect(0, 0, w, h);
        } else if (grade === 'neon') {
            grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
            grad.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
            grad.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        } else if (grade === 'malam') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgba(20, 20, 60, 0.4)';
            ctx.fillRect(0, 0, w, h);

            ctx.globalCompositeOperation = 'screen';
            grad = ctx.createLinearGradient(0, h, 0, 0);
            grad.addColorStop(0, 'rgba(100, 50, 255, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
    }

    drawFrame(layoutDef, w, h) {
        const { ctx } = this;
        const thickness = 10;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = thickness;
        
        // Outer frame
        ctx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);

        // Lines between panels
        if (layoutDef.length > 1) {
            ctx.fillStyle = '#fff';
            layoutDef.forEach((rect, i) => {
                // This is simplified, getLayout already handles gaps.
                // We just need to make sure the gaps are white.
            });
            
            // Refined frame: fill the gaps
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    drawCaption(caption, w, h) {
        const { ctx } = this;
        const { main, sub, color, size, position } = caption;

        ctx.save();
        
        const fontSizeMain = (w * 0.08) * size;
        const fontSizeSub = fontSizeMain * 0.3;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = w / 2;
        let y = position === 'top' ? h * 0.2 : h * 0.85;

        // Draw Sub
        ctx.font = `bold ${fontSizeSub}px 'Arial Narrow', Impact, sans-serif`;
        ctx.letterSpacing = '4px';
        this.drawTextWithOutline(sub, x, y - fontSizeMain * 0.6, '#fff', fontSizeSub * 0.15);

        // Draw Main
        ctx.font = `900 ${fontSizeMain}px 'Arial Narrow', Impact, sans-serif`;
        ctx.letterSpacing = '2px';
        this.drawTextWithOutline(main, x, y, color, fontSizeMain * 0.1);

        ctx.restore();
    }

    drawTextWithOutline(text, x, y, color, outlineWidth) {
        const { ctx } = this;
        
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = outlineWidth * 2;
        ctx.shadowOffsetX = outlineWidth;
        ctx.shadowOffsetY = outlineWidth;

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = outlineWidth * 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        // Fill
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
}
