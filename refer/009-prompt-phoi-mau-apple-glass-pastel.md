# 009. Prompt phối màu Apple Glass Pastel cho dự án khác

## Prompt copy nhanh

Bạn là một senior UI/UX designer. Hãy thiết kế giao diện theo phong cách **Apple glassmorphism + pastel functional palette** cho một ứng dụng web hiện đại, sáng, sạch, dễ nhìn, phù hợp công cụ workflow/SaaS/AI studio.

Yêu cầu phối màu:

1. Nền tổng thể dùng mesh gradient pastel mềm, không dùng màu phẳng. Nền nên có cảm giác như wallpaper macOS/iOS, gồm các lớp hồng nhạt, xanh nhạt, tím nhạt phủ trên nền xám xanh rất sáng.
   - Base gradient: `#f6f7fb` đến `#eef0f7`
   - Pink glow: `rgba(255, 200, 220, 0.55)`
   - Blue glow: `rgba(180, 215, 255, 0.55)`
   - Light blue glow: `rgba(200, 230, 255, 0.50)`
   - Purple glow: `rgba(230, 215, 255, 0.50)`

2. Card, sidebar, toolbar, modal dùng glass surface:
   - Background: `rgba(255, 255, 255, 0.65)`
   - Backdrop blur: `24px`
   - Saturation: `180%`
   - Border: `1px solid rgba(255, 255, 255, 0.55)`
   - Shadow nhẹ, mềm, đổ xuống dưới; tránh shadow đen quá mạnh.

3. Brand color chính là xanh dương hiện đại:
   - Primary: `#2563eb`
   - Primary dark: `#1e3a8a`
   - Primary light: `#dbeafe`
   - Primary 50: `#eff6ff`
   Dùng primary cho CTA, link, focus ring, icon quan trọng và title gradient.

4. Typography và neutral:
   - Text chính: `#111827`
   - Heading hoặc text đậm: `#0f172a`, `#111827`
   - Text phụ: `#6b7280`
   - Text mờ: `#9ca3af`
   - Border nhẹ: `#e5e7eb`
   - Surface trắng: `#ffffff`
   Giao diện phải giữ contrast tốt, không dùng pastel cho chữ chính.

5. Title chính dùng gradient chữ:
   - `linear-gradient(to right, #0f172a 0%, #2563eb 100%)`
   - Clip vào text, chữ trong suốt.

6. Các nhóm chức năng dùng màu accent riêng. Mỗi nhóm phải có 1 màu đậm cho icon/chip/handle và 1 màu soft rất nhạt cho nền icon:
   - Input / Audio / Talk: accent `#34C759`, soft `#E8F8EC`, text `#1F7D38`
   - Motion / Video / Teaser: accent `#FF2D55`, soft `#FCE5EB`, text `#A11D38`
   - Image AI / Magic: accent `#AF52DE`, soft `#F4E9FB`, text `#702A98`
   - Compose / Technical / HTTP / Merge: accent `#5856D6`, soft `#ECECFB`, text `#3E3CA8`
   - Try-on / Subtitle / Condition / Debug / Special: accent `#FF9500`, soft `#FFF1DD`, text `#A86200`
   - Validate / Check: accent `#1F7D38`, soft `#DCF4E2`, text `#0F4F1F`
   - Output / Result: accent `#8E8E93`, soft `#EFEFF4`, text `#3C3C43`

7. Không phủ màu đậm lên diện rộng. Công thức cho card chức năng là:
   - Card nền trắng kính
   - Icon nằm trong ô vuông bo góc có nền soft
   - Icon/chấm/cổng dùng accent đậm
   - Text dùng gray scale
   - Chỉ CTA chính mới dùng nền primary đậm

8. Status color:
   - Success: xanh lá / emerald
   - Running / warning: amber hoặc orange
   - Error: rose/red
   - Info / queued: blue
   Dùng status color nhất quán cho badge, border, icon và log.

9. Bo góc và bóng:
   - Card/sidebar lớn: bo `24px`
   - Button/pill: bo tròn full hoặc `999px`
   - Input nhỏ: bo `10px-12px`
   - Shadow nhẹ: `0 2px 8px rgba(0,0,0,0.04)`
   - Panel lớn: `0 8px 30px rgba(0,0,0,0.06)`
   - CTA primary: `0 4px 16px rgba(37,99,235,0.12)`

10. Cảm giác tổng thể:
   - Sáng, trong, mềm, hiện đại
   - Có chiều sâu nhờ kính và blur
   - Màu sắc phân nhóm chức năng rõ ràng nhưng không rối
   - Tránh nền tối, tránh palette một màu, tránh gradient tím/xanh quá gắt
   - UI phải giống một công cụ làm việc cao cấp, không giống landing page marketing.

Hãy áp dụng phong cách này vào toàn bộ UI: layout, sidebar, header, card, node, inspector, modal, button, table, dashboard, empty state và trạng thái loading/error/success.

## CSS token gợi ý

```css
:root {
  --primary: #2563eb;
  --primary-dark: #1e3a8a;
  --primary-light: #dbeafe;
  --primary-50: #eff6ff;

  --foreground: #111827;
  --muted: #6b7280;
  --muted-light: #9ca3af;
  --border: #e5e7eb;
  --surface: #ffffff;

  --success: #198754;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #0dcaf0;

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-island: 0 8px 30px rgba(0, 0, 0, 0.06);
  --shadow-pill: 0 4px 16px rgba(37, 99, 235, 0.12), 0 1px 2px rgba(0,0,0,0.04);
}

body {
  background:
    radial-gradient(60% 50% at 85% 5%, rgba(255, 200, 220, 0.55), transparent 60%),
    radial-gradient(55% 50% at 5% 25%, rgba(180, 215, 255, 0.55), transparent 65%),
    radial-gradient(55% 50% at 95% 95%, rgba(200, 230, 255, 0.50), transparent 60%),
    radial-gradient(70% 60% at 0% 100%, rgba(230, 215, 255, 0.50), transparent 65%),
    linear-gradient(180deg, #f6f7fb 0%, #eef0f7 100%);
  background-attachment: fixed;
  color: var(--foreground);
}

.glass {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: var(--shadow-card);
}

.title-gradient {
  background: linear-gradient(to right, #0f172a 0%, #2563eb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
```
