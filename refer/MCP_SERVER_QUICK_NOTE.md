# Cách họ làm MCP Server và MCP

## 1. MCP là chuẩn cắm tool cho AI

MCP không phải là model mới. Nó là protocol để Claude, LLM hoặc AI Agent dùng được tool, resource và prompt bên ngoài theo một chuẩn chung.

Trước MCP:

- App A tự nối tool thời tiết.
- App B tự nối tool thời tiết.
- Claude, agent, LLM tự host mỗi bên tích hợp một kiểu.

Sau MCP:

- Mình viết một `MCP Server`.
- Server expose tool, resource và prompt.
- Claude Desktop, LLM hoặc Agent chỉ cần kết nối vào server đó.

## 2. Họ tạo MCP Server bằng Python và FastMCP

Server demo có dạng:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("MCP Server")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool()
def get_current_temperature(city_name: str) -> str:
    """Get current temperature of a city"""
    return "20 degrees Celsius"

if __name__ == "__main__":
    mcp.run(transport="sse")
```

Điểm quan trọng: docstring như `"Get current temperature of a city"` phải viết rõ, vì LLM đọc phần mô tả này để biết khi nào nên gọi tool.

## 3. Ngoài tool, họ còn demo resource và prompt

Tool là hành động hoặc hàm:

- Cộng hai số.
- Lấy nhiệt độ thành phố.

Resource là tài nguyên đọc được:

- Ví dụ mã số thuế.
- Ví dụ resource động chào theo tên.

Prompt là template dùng lại:

- Ví dụ prompt review câu và xóa thông tin cá nhân.

Tức là MCP Server không chỉ có function calling, mà còn đóng gói cả dữ liệu và prompt mẫu.

## 4. Họ chọn SSE, nhưng Claude Desktop demo bằng stdio

Có hai kiểu chạy:

- `stdio`: Claude Desktop gọi trực tiếp file Python qua command. Dễ demo local nhưng dễ lỗi đường dẫn Python, virtualenv và package.
- `sse`: chạy như một server/API ở `localhost:8000/sse`. Dễ debug, dễ deploy, dễ đổi sang server thật.

Người giảng nói họ thích `sse` hơn vì giống backend service, sạch hơn khi triển khai lâu dài.

## 5. Họ test MCP Server trước khi nối Claude

Họ viết một client test để:

1. Kết nối tới MCP server.
2. `list_tools` để xem server expose tool gì.
3. `call_tool("add", {"a": 4, "b": 6})` để kiểm tra ra `10`.
4. Gọi tool nhiệt độ.
5. Đọc resource.
6. Lấy prompt.

Đây là bước rất đúng: server phải chạy chuẩn trước, rồi mới nối Claude hoặc Agent.

## 6. Nối vào Claude Desktop

Trong Claude Desktop:

1. Vào Settings.
2. Vào Developer.
3. Chọn Edit config.
4. Thêm MCP server bằng command Python và đường dẫn file `mcp_server.py`.
5. Restart Claude.
6. Claude hiện biểu tượng tool.
7. Khi hỏi `What is temperature in Hà Nội?`, Claude xin quyền gọi tool rồi trả về `20°C`.

## 7. Nối vào LLM và Agent

Họ demo thêm hai kiểu:

- LLM tự host: tự viết vòng lặp list tool, model chọn tool, gọi MCP, đưa kết quả lại model.
- OpenAI Agent framework: truyền MCP server vào agent, framework tự lo phần gọi tool nên code ngắn hơn nhiều.

## Kết luận

Họ làm MCP bằng cách viết một Python server expose tool, resource và prompt; test server bằng MCP client; rồi kết nối server đó vào Claude Desktop, LLM tự host hoặc OpenAI Agent.

Nếu học lại theo thứ tự, nên đi theo flow:

1. Hiểu MCP là chuẩn hóa kết nối tool cho AI.
2. Viết MCP Server nhỏ bằng FastMCP.
3. Test `list_tools`, `call_tool`, `read_resource`, `get_prompt`.
4. Nối vào Claude Desktop.
5. Nối vào LLM/Agent.
6. Khi làm thật, ưu tiên SSE, logging, timeout, quyền truy cập và kiểm soát tool call.
