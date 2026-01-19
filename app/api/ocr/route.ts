import { NextRequest, NextResponse } from 'next/server';

const OCR_PROMPT = `
##Nhân vật
  Bạn là công cụ OCR & trích xuất dữ liệu, có khả năng đọc và phân tích chính xác nội dung từ hình ảnh giấy tờ/hệ thống hành chính.

##Kỹ năng
  Nhận diện ký tự quang học (OCR) chính xác. Hiểu và phân tích hình ảnh để chuyển đổi chữ viết thành văn bản số.
  Xử lý ảnh đầu vào (Image Preprocessing) - làm rõ hình ảnh trước khi OCR.
  Phân tích bố cục tài liệu (Layout Analysis) - xác định và phân tách các vùng thông tin.
  Hiểu ngữ cảnh và trích xuất thông tin có cấu trúc.
  Đa ngôn ngữ và đa định dạng - nhận diện Tiếng Việt.

##Ràng buộc
  Độ chính xác cao - ký tự phải khớp chính xác ≥ 90%.
  Trích xuất đúng định dạng - ngày tháng: dd/mm/yyyy.
  Đảm bảo cấu trúc dữ liệu JSON đầu ra.
  Nếu key nào không có giá trị hoặc dữ liệu không thể đọc hãy để là "Chưa xác định" và gắn icon 🚩.

  Với key "ngay_sinh" phải theo định dạng "dd/mm/yyyy"
  Với key "gioi_tinh" chỉ bao gồm 1 từ "Nam" hoặc "Nữ"
  Với key "so_CCCD" trên hình ảnh có thể là Thẻ CCCD hoặc Hộ chiếu 
  Với các trường địa chỉ nếu phát hiện có 5 ký tự số liền kề thì không lấy ký tự số này.
  Với các trường địa chỉ chỉ viết hoa chữ cái đầu tiên của các từ.

##Lưu ý
  KHÔNG ĐƯỢC THÊM BẤT KỲ NỘI DUNG, TỪ NGỮ NGOÀI VÀO chuẩn đầu ra.
  Chỉ được trích xuất đúng, đủ, sạch và chính xác.
  Định dạng số không để dấu ngăn cách phần ngàn.
  Nếu trường không có dữ liệu → ghi "Chưa xác định 🚩".
  CHỈ TRẢ VỀ JSON, KHÔNG CÓ BẤT KỲ TEXT NÀO KHÁC.
  Các thành viên cùng mã hộ khẩu thì cùng nơi thường trú.
  Thông tin gia đình tìm kiếm thông tin là cha, mẹ, anh, chị.

##Mô tả các trường thông tin cần trích xuất (CHỈ những trường này, không thêm trường khác):
{
  "ho_ten": "",
  "ngay_sinh": "",
  "gioi_tinh": "",
  "dan_toc": "",
  "ton_giao": "",
  "tinh_trang_hon_nhan": "",
  "so_CMND": "",
  "so_CCCD": "",
  "ngay_cap": "",
  "noi_cap": "",
  "que_quan": "",
  "noi_dang_ky_khai_sinh": "",
  "noi_thuong_tru": "",
  "noi_o_hien_tai": "",
  "nghe_nghiep": "",
  "so_dien_thoai": "",
  "thong_tin_gia_dinh": [
     {
      "ho_ten": "",
      "so_CMND": "",
      "so_CCCD": "",
      "moi_quan_he": ""
    }
  ],
  "thong_tin_thanh_vien_trong_ho": [
    {
      "quan_he": "",
      "ho_ten": "",
      "so_CMND": "",
      "so_CCCD": ""
    }
  ]
}
`;

export async function POST(request: NextRequest) {
    try {
        const { images, apiKey, model = 'gpt-4o-mini' } = await request.json();

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng cung cấp ít nhất một hình ảnh' },
                { status: 400 }
            );
        }

        // Use provided API key or fallback to env
        const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API Key chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào file .env' },
                { status: 400 }
            );
        }

        // Prepare image content for OpenAI Vision API
        const imageContents = images.map((img: { mimeType: string; base64: string }) => ({
            type: 'image_url' as const,
            image_url: {
                url: `data:${img.mimeType};base64,${img.base64}`,
                detail: 'high' as const,
            },
        }));

        // Call OpenAI API
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là chuyên gia OCR trích xuất thông tin từ giấy tờ tùy thân Việt Nam. Luôn trả về JSON hợp lệ.',
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: OCR_PROMPT },
                            ...imageContents,
                        ],
                    },
                ],
                max_tokens: 4096,
                temperature: 0.1,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI API Error:', errorData);

            if (response.status === 429) {
                return NextResponse.json(
                    { success: false, error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.' },
                    { status: 429 }
                );
            }
            if (response.status === 401) {
                return NextResponse.json(
                    { success: false, error: 'API Key không hợp lệ hoặc đã hết hạn.' },
                    { status: 401 }
                );
            }
            if (response.status === 400) {
                return NextResponse.json(
                    { success: false, error: errorData.error?.message || 'Dữ liệu yêu cầu không hợp lệ.' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: false, error: `Lỗi API: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
                { status: response.status }
            );
        }

        const result = await response.json();
        const textContent = result.choices?.[0]?.message?.content;

        if (!textContent) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy nội dung trong phản hồi từ OpenAI.' },
                { status: 500 }
            );
        }

        // Parse JSON response
        let parsedData;
        try {
            parsedData = JSON.parse(textContent);
        } catch {
            // Try removing markdown code block if present
            const cleaned = textContent.replace(/```json\n?|\n?```/g, '').trim();
            try {
                parsedData = JSON.parse(cleaned);
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Không thể parse kết quả JSON từ AI.' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            model_used: model,
            ai_provider: 'openai',
            processed_at: new Date().toISOString(),
            usage: result.usage,
        });
    } catch (error) {
        console.error('OCR API Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Lỗi không xác định' },
            { status: 500 }
        );
    }
}
