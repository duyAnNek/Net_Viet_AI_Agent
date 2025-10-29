# Net_Viet_AI_Agent
# Chatbot Truy Vấn Dữ Liệu Doanh Nghiệp (AI-Integrated Chat System)

## Giới thiệu
Dự án này xây dựng một hệ thống chatbot dựa trên AI (sử dụng mô hình GPT của OpenAI) để hỗ trợ truy vấn dữ liệu doanh nghiệp một cách tự nhiên bằng tiếng Việt. Người dùng có thể chat để lấy thông tin về nhân viên (employees), sản phẩm (products), và giá trị tồn kho (inventory value). Hệ thống bao gồm giao diện web thân thiện, backend API, cơ sở dữ liệu, tích hợp AI với function calling, và triển khai fullstack.

### Mục tiêu chính
- Xây dựng giao diện chat đơn giản, hỗ trợ đăng nhập/đăng ký.
- Tích hợp rule-based chat ban đầu, sau đó nâng cấp bằng LLM (Large Language Model) với tool functions.
- Hiển thị dữ liệu dưới dạng bảng (employees, products).
- Đảm bảo tính bảo mật, hiệu năng, và dễ triển khai.

### Phạm vi dự án
- Tuần 1-2: Khởi động, thiết kế schema, giao diện cơ bản.
- Tuần 3-4: Xây dựng API, tích hợp AI, test dữ liệu.
- Tuần 5-6: Hoàn thiện, kiểm thử, deploy và báo cáo.

Dự án được thực hiện bởi nhóm 6 thành viên, theo kế hoạch phân công chi tiết.

## Công nghệ sử dụng
- **Frontend**: HTML/CSS/JavaScript (có thể dùng framework như React nếu cần mở rộng).
- **Backend**: Node.js/Express (hoặc Python Flask), REST API.
- **Database**: SQL (PostgreSQL/MySQL), ORM (Sequelize hoặc SQLAlchemy).
- **AI**: OpenAI GPT API với function calling (tools: get_employee_count, get_product_info, etc.).
- **DevOps**: Git, Docker, Docker Compose; Deploy trên Render/Fly.io/Vercel.
- **Công cụ khác**: Swagger cho API docs, Prompt engineering cho LLM.

## Phân công vai trò & Nhiệm vụ
| STT | Thành viên          | Vai trò              | Nhiệm vụ chính                          | 
|-----|---------------------|----------------------|-----------------------------------------|
| 1   | Nguyễn Dương Lệ Chi | Giao diện (Frontend) | Thiết kế UI web/chat, phối hợp backend & test | 
| 2   | Bùi Đức Thuận       | Backend              | Xây dựng API, DB, logic xử lý           |
| 3   | Nguyễn Quốc Huy     | Dữ liệu              | Thiết kế schema, seed dữ liệu, tối ưu truy vấn |
| 4   | Trịnh Quốc Trường   | AI & Tích hợp        | Kết nối GPT, function calling, viết prompt |
| 5   | Mai Ngọc Khải       | Kiểm thử & Báo cáo   | Test hệ thống, viết báo cáo & slide     |
| 6   | Nguyễn Duy An       | DevOps & Triển khai  | Quản lý repo, Docker, deploy            |

Chi tiết nhiệm vụ từng thành viên xem trong các sheet tương ứng (Tổng quan, Phân công & Vai trò).

## Cài đặt & Chạy dự án
### Yêu cầu hệ thống
- Node.js (v18+) hoặc Python 3.10+.
- Docker (cho containerization).
- OpenAI API key (lấy từ [OpenAI](https://platform.openai.com/api-keys)).

### Các bước cài đặt
1. **Clone repository**:
git clone <repo-url>
cd chatbot-enterprise

2. **Cài đặt dependencies**:
- Backend (thư mục `backend`):
npm install
Hoặc pip install -r requirements.txt nếu dùng Python
- Frontend (thư mục `frontend`):
npm install

3. **Cấu hình môi trường**:
- Tạo file `.env` dựa trên `.env.example`:
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=your-jwt-secret
PORT=3000
- Seed dữ liệu mẫu (chạy script từ Thành viên 3):
node scripts/seed.js
Hoặc python scripts/seed.py

4. **Chạy local**:
- Database & Backend:
docker-compose up db backend
- Frontend:
npm start
- Truy cập: http://localhost:3000

5. **Test API**:
- Sử dụng Swagger: http://localhost:3000/api-docs
- Endpoints chính:
- `GET /employees` - Lấy danh sách nhân viên.
- `GET /products` - Lấy danh sách sản phẩm.
- `POST /chat` - Gửi tin nhắn chat (rule-based hoặc AI).

### Docker Deployment
- Build & run fullstack:
docker-compose up --build

## Sử dụng
1. **Đăng nhập/Đăng ký**: Sử dụng form UI để auth (giả lập ban đầu).
2. **Chat**: Nhập câu hỏi tự nhiên như "Số lượng nhân viên hiện tại là bao nhiêu?" hoặc "Sản phẩm nào có giá trên 100k?".
 - Hệ thống sẽ gọi tool functions qua GPT để lấy dữ liệu từ DB.
3. **Xem dữ liệu**: Chuyển tab để xem bảng employees/products.
4. **Demo**: Truy cập URL deploy (sẽ cập nhật sau khi triển khai).

### Ví dụ Prompt cho AI
- System role: "Bạn là trợ lý AI hỗ trợ truy vấn dữ liệu doanh nghiệp. Trả lời ngắn gọn, bằng tiếng Việt."
- User: "Liệt kê 5 sản phẩm bán chạy nhất."

## Kế hoạch tiến độ
| Công việc                  | Phụ trách  | Thời gian (Tuần) | Ghi chú                          |
|----------------------------|------------|------------------|----------------------------------|
| Họp khởi động & chốt kế hoạch | Cả nhóm   | 1                | Phân công, chọn công nghệ, timeline |
| Họp tiến độ hằng tuần      | Cả nhóm   | 1-4              | Cập nhật tiến độ, xử lý vướng mắc |
| Chuẩn bị demo & báo cáo    | Thành viên 1 | 5,6,4          | Giao diện; Nội dung; Deploy      |

Chi tiết tiến độ theo tuần và thành viên (xem file Excel gốc).

## Vấn đề thường gặp & Hỗ trợ
- **Lỗi kết nối DB**: Kiểm tra `DATABASE_URL` trong `.env`.
- **API Key OpenAI**: Đảm bảo key hợp lệ và có credit.
- **Bug UI/API**: Report qua Git issues hoặc họp nhóm.
- Hỗ trợ: Liên hệ trưởng nhóm (Thành viên 1) hoặc xem ghi chú trong phân công.

## Báo cáo & Tài liệu
- Báo cáo đồ án: 5 chương (Mở đầu → Kết luận) - Thành viên 5.
- Slide thuyết trình: Kết hợp demo giao diện - Thành viên 1 & 5.
- Docs: README này, API Swagger, Prompt templates (Thành viên 4).

## Giấy phép
MIT License - Dự án học thuật, không thương mại.
