document.addEventListener("DOMContentLoaded",function(){let l=document.getElementById("initial-state"),d=document.getElementById("loading-state"),u=document.getElementById("error-state"),m=document.getElementById("result-state"),t=document.getElementById("error-message"),_=document.getElementById("json-output"),i=document.getElementById("json-validation-error"),e=document.getElementById("btn-convert");var n=document.getElementById("btn-save"),a=document.getElementById("btn-reset");let p=new Dropzone("#dropzone-basic",{previewTemplate:`<div class="dz-preview dz-file-preview">
<div class="dz-details">
  <div class="dz-thumbnail">
    <img data-dz-thumbnail>
    <span class="dz-nopreview">No preview</span>
    <div class="dz-success-mark"></div>
    <div class="dz-error-mark"></div>
    <div class="dz-error-message"><span data-dz-errormessage></span></div>
    <div class="progress">
      <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuemin="0" aria-valuemax="100" data-dz-uploadprogress></div>
    </div>
  </div>
  <div class="dz-filename" data-dz-name></div>
  <div class="dz-size" data-dz-size></div>
</div>
</div>`,parallelUploads:1,maxFilesize:5,acceptedFiles:"image/*",addRemoveLinks:!0,maxFiles:null,autoProcessQueue:!1,createImageThumbnails:!0,thumbnailWidth:120,thumbnailHeight:120});function h(){var n=p.files.length,t=e.querySelector("span.d-none.d-sm-inline-block");t.textContent=0===n||1===n?"Chuyển đổi":`Chuyển đổi (${n} ảnh)`,e.disabled=!1}p.on("addedfile",function(o){var n=new FileReader;n.onload=function(n){n=n.target.result;o.base64Data=n.split(",")[1],o.base64Full=n,o.isProcessed=!0;{var i=o;let e=i.previewElement.querySelector("[data-dz-uploadprogress]");if(e){let n=0,t=setInterval(()=>{100<=(n+=15*Math.random()+5)&&(n=100,clearInterval(t),i.previewElement.classList.add("dz-success"),setTimeout(()=>{let n=i.previewElement.querySelector(".progress");n&&(n.style.opacity="0",setTimeout(()=>{n.style.display="none"},300))},800)),e.style.width=n+"%",e.setAttribute("aria-valuenow",n),50<n&&(e.style.background="linear-gradient(90deg, var(--bs-success) 0%, var(--bs-primary) 100%)")},100+200*Math.random())}}},n.readAsDataURL(o),o.previewElement.addEventListener("click",function(h){h.preventDefault(),h.stopPropagation();{h=o;let n=new bootstrap.Modal(document.getElementById("imagePreviewModal")),e=document.getElementById("modalImage"),t=document.getElementById("imageInfo"),i=document.getElementById("imageLoading"),a=(i.classList.remove("d-none"),e.style.display="none",e.src=h.base64Full||URL.createObjectURL(h),r=e,(h.size/1024).toFixed(1));t.textContent=`${h.name} | ${a} KB | `+h.type,e.onload=function(){i.classList.add("d-none"),e.style.display="block";var n,t=document.getElementById("downloadImage");t&&(n=t.cloneNode(!0),t.parentNode.replaceChild(n,t),n.addEventListener("click",function(){var n;r&&r.src&&((n=document.createElement("a")).href=r.src,n.download="image_preview.jpg",document.body.appendChild(n),n.click(),document.body.removeChild(n))}))},n.show()}}),s(),h()}),p.on("removedfile",function(n){s(),h()});let v=`
##Nhân vật
  Bạn là công cụ OCR & trích xuất dữ liệu, có khả năng đọc và phân tích chính xác nội dung từ hình ảnh giấy tờ/hệ thống hành chính.

##Kỹ năng
  Nhận diện ký tự quang học (OCR) chính xác Hiểu và phân tích hình ảnh để chuyển đổi chữ viết thành văn bản số. Có khả năng xử lý nhiều loại font chữ, kích cỡ, và cả chữ viết tay (nếu nâng cao). Phân biệt các ký tự tương tự (như "O" và số "0", "l" và số "1").
  Xử lý ảnh đầu vào (Image Preprocessing) Làm rõ hình ảnh trước khi OCR bằng các kỹ thuật: Lọc nhiễu (denoising), Chuyển ảnh sang trắng đen (binarization), Cân chỉnh góc nghiêng (deskewing), Cắt lề, cắt vùng chứa văn bản (cropping). Đảm bảo hình ảnh chất lượng thấp vẫn có thể xử lý.
  Phân tích bố cục tài liệu (Layout Analysis) Xác định và phân tách các vùng: tiêu đề, bảng, nội dung, số liệu, chữ ký… Nhận diện cấu trúc lưới, hàng, cột trong bảng hóa đơn. Xử lý được nhiều định dạng khác nhau (PDF scan, ảnh chụp, biểu mẫu định sẵn hoặc tự do).
  Hiểu ngữ cảnh và trích xuất thông tin có cấu trúc Không chỉ nhận chữ, mà còn gắn nhãn đúng cho các thông tin: Mã số thuế, số hóa đơn, ngày phát hành, người bán/mua, thành tiền, thuế suất…
  Đa ngôn ngữ và đa định dạng Nhận diện được nhiều ngôn ngữ: Tiếng Việt, Anh, Trung Quốc, Nhật Bản… Phân biệt đơn vị tiền tệ, định dạng ngày tháng, dấu thập phân theo vùng.
  Tính năng hậu xử lý (Post-processing) Chuẩn hóa đầu ra: định dạng ngày, loại bỏ khoảng trắng thừa, sửa lỗi chính tả... So sánh dữ liệu OCR với dữ liệu gốc (nếu có) để tự động hiệu chỉnh
  Xác định rõ từng trường thông tin cá nhân, hộ khẩu, quan hệ gia đình.

##Ràng buộc

  Độ chính xác cao (Accuracy Constraint) Ký tự phải khớp chính xác ≥ 90% (với văn bản rõ nét), đặc biệt với các trường quan trọng như: Số hóa đơn, mã số thuế, ngày phát hành, tổng tiền, thuế suất. Sai sót ký tự phải dưới ngưỡng cho phép, ví dụ: ≤ 1 ký tự sai trên 100 ký tự.
  Trích xuất đúng định dạng (Field Formatting Constraint) Các trường dữ liệu phải có định dạng đúng: Ngày tháng: dd/mm/yyyy hoặc yyyy-mm-d
  Đảm bảo cấu trúc dữ liệu (Structured Output Constraint) Đầu ra phải là dữ liệu có cấu trúc, dưới các định dạng phổ biến: JSON Mỗi trường phải có key rõ ràng,
  Đảm bảo thứ tự & phân vùng (Zoning/Order Constraint) Nếu là thong_tin_gia_dinh  nhiều dòng, phải giữ thứ tự dòng chính xác. Cần phân biệt rõ các vùng không trộn lẫn.
  Đảm bảo tất cả các trường trên được trích xuất và trả về trong cấu trúc JSON, với các key tương ứng như ví dụ,  nếu key nào không có giá trị hoặc dự liệu không thể đọc  hãy để là chưa xác định và gắn icon 🚩.

  Với key "ngay_sinh" phải bao gồm input "ngày", "tháng", "năm sinh" theo định dạng "dd/mm/yyyy"
  Với key "gioi_tinh" chỉ bao gồm 1 từ "Nam" hoặc "Nữ"
  Với các trường thông tin noi_dang_ky_khai_sinh, noi_thuong_tru, noi_o_hien_tai, que_quan  nếu phát hiện có 5 ký tự số liền kề thì không lấy ký tự số này.
  Với các trường thông tin noi_dang_ky_khai_sinh, noi_thuong_tru, noi_o_hien_tai, que_quan chỉ viết hoa chữ cái đầu tiên của các từ
  Với trường thông tin noi_thuong_tru phải bao gồm thông tin từ địa chỉ cụ thể như " Xóm, thôn, khu phố, số nhà" nếu có và  input  Xã/Phường/Đặc khu và Tỉnh/thành phố 
  Với các trường thong_tin_gia_dinh phải xác định mối quan hệ dựa trên label các trường input, sắp xếp theo thứ tự vai vế trong gia đình và viết hoa chữ cái đầu tiên

##Lưu ý
  KHÔNG ĐƯỢC THÊM BẤT KỲ NỘI DUNG, TỪ NGỮ  NGOÀI VÀO chuẩn đầu ra.
  Chỉ được trích xuất đúng, đủ, sạch và chính xác.
  Định dạng số không để dấu ngăn cách phần ngàn
  Đặc biệt lưu ý Data mockup trong "Ví dụ các key trong đầu ra dữ liệu" chỉ mang tính tham khảo không lấy data này đưa vào đầu ra.
  Nếu trường không có dữ liệu → ghi rõ "Chưa có dữ liệu".
  Với ngày tháng năm sinh → tách thành ngày, tháng, năm.
  Với CCCD/CMND → ghi rõ số và loại.
  Với quan hệ hộ khẩu → ghi đúng như trong ảnh (Chủ hộ, Con đẻ, Vợ, Con).


##Mô tả các trường thông tin cần trích xuất  
 {
  "thong_tin_cong_dan": {
    "ho_ten": "",
    "ngay_sinh": "",
    "gioi_tinh": "",
    "nhom_mau": "",
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
   "so_dien_thoai":"",
  },
  "thong_tin_gia_dinh": [
     {
      "ho_ten": "",
      "so_CMND": "",
      "so_CCCD": "",
      "moi_quan_he":""
}],
  "thong_tin_thanh_vien_trong_ho": [
    {
      "quan_he": "",
      "ho_ten": "",
      "so_CMND": "",
      "so_CCCD": ""
    }
  ]
}
`;function s(){l.classList.remove("d-none"),d.classList.add("d-none"),u.classList.add("d-none"),m.classList.add("d-none")}function y(n){t.textContent=n,l.classList.add("d-none"),d.classList.add("d-none"),u.classList.remove("d-none"),m.classList.add("d-none")}function N(n){var t=d.querySelector("p");t&&(t.textContent=n)}e.addEventListener("click",async function(){if(0===p.files.length)y("Vui lòng chọn ít nhất một hình ảnh để chuyển đổi.");else{var n=document.getElementById("apiKey").value.trim(),t=document.getElementById("customPrompt").value.trim()||v,e=document.getElementById("aiModel").value;if(n){var i,a=p.files.length,h=d.querySelector("p"),h=(h.textContent=1<a?`Đang xử lý ${a} ảnh, vui lòng chờ...`:"Đang xử lý, vui lòng chờ...",l.classList.add("d-none"),d.classList.remove("d-none"),u.classList.add("d-none"),m.classList.add("d-none"),performance.now());try{N("Đang chuẩn bị hình ảnh..."),await new Promise(n=>{let t=setInterval(()=>{0===p.files.filter(n=>!n.isProcessed).length&&(clearInterval(t),n())},100);setTimeout(()=>{clearInterval(t),n()},1e4)}),N("Đang thu thập dữ liệu hình ảnh...");var o,s,r,{imageParts:c,errors:g}=(()=>{let e=[],i=[];return p.files.forEach((n,t)=>{n.base64Data&&n.isProcessed?e.push({inline_data:{mime_type:n.type,data:n.base64Data}}):i.push({success:!1,index:t,error:"File chưa được xử lý hoặc có lỗi",fileName:n.name})}),{imageParts:e,errors:i}})();0<g.length&&(console.warn("Một số file không thể xử lý:",g),g.forEach(n=>{console.error(`File "${n.fileName}": `+n.error)})),0===c.length?y("Không thể xử lý bất kỳ hình ảnh nào. Vui lòng kiểm tra định dạng và kích thước file."+(0<g.length?`

Chi tiết lỗi:
`+g.map(n=>`- ${n.fileName}: `+n.error).join("\n"):"")):(N(`Đang gọi Gemini API để xử lý ${c.length} hình ảnh...`),o=await(async(n,t,e,i="gemini-2.0-flash-exp")=>{i=`https://generativelanguage.googleapis.com/v1beta/models/${i}:generateContent?key=`+n,n={contents:[{parts:[{text:e},...t]}],generationConfig:{response_mime_type:"application/json",temperature:.1,maxOutputTokens:8192,topP:.95,topK:40},safetySettings:[{category:"HARM_CATEGORY_HARASSMENT",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_HATE_SPEECH",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_NONE"}]};let a=new AbortController;e=setTimeout(()=>a.abort(),6e4);try{var h=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(n),signal:a.signal,keepalive:!1,cache:"no-cache",redirect:"follow"});if(clearTimeout(e),!h.ok){var o=await h.text();if(429===h.status)throw new Error("QUOTA_EXCEEDED: Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.");if(403===h.status)throw new Error("API_KEY_INVALID: API Key không hợp lệ hoặc không có quyền truy cập.");if(400===h.status)throw new Error("INVALID_REQUEST: Dữ liệu yêu cầu không hợp lệ. Kiểm tra kích thước và định dạng ảnh.");throw new Error(`API request failed with status ${h.status}: `+o)}var s=await h.json();if(!s.candidates?.[0]?.content?.parts?.[0]?.text)throw new Error("Không tìm thấy nội dung văn bản trong phản hồi từ Gemini.");var r=s.candidates[0].content.parts[0].text;try{return JSON.parse(r)}catch(n){var c=r.replace(/```json\n?|\n?```/g,"").trim();return JSON.parse(c)}}catch(n){if(clearTimeout(e),"AbortError"===n.name)throw new Error("REQUEST_TIMEOUT: Yêu cầu quá thời gian chờ. Vui lòng thử lại với ít ảnh hơn.");throw n}})(n,c,t,e),s=Math.round(performance.now()-h),r={ai_provider:"gemini",model_used:e,total_images:p.files.length,processed_successfully:c.length,failed_images:g.length,processing_time_ms:s,processing_time:(new Date).toISOString(),...0<g.length&&{processing_errors:g.map(n=>({file:n.fileName,error:n.error}))},...o},i=JSON.stringify(r,null,2),_.textContent=i,hljs.highlightElement(_),l.classList.add("d-none"),d.classList.add("d-none"),u.classList.add("d-none"),m.classList.remove("d-none"),C())}catch(n){console.error("API Error:",n);let t="Đã xảy ra lỗi khi xử lý yêu cầu.";y(t=n.message.includes("API_KEY_INVALID")||n.message.includes("403")?"API Key không hợp lệ. Vui lòng kiểm tra lại API Key.":n.message.includes("QUOTA_EXCEEDED")||n.message.includes("429")?"Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.":n.message.includes("400")?"Dữ liệu gửi đi không hợp lệ. Vui lòng kiểm tra lại hình ảnh.":n.message.includes("Network")?"Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.":"Lỗi: "+n.message)}}else y("Vui lòng nhập API Key để tiếp tục.")}});let r=null;document.addEventListener("DOMContentLoaded",function(){var n=document.getElementById("imagePreviewModal");n&&n.addEventListener("hidden.bs.modal",function(){r=null})});let o;function C(){clearTimeout(o),o=setTimeout(()=>{var n=_.textContent;if(n.trim())try{var t=JSON.parse(n),e=(i.textContent="",JSON.stringify(t,null,2));n!==e&&(_.textContent=e),requestAnimationFrame(()=>{hljs.highlightElement(_)})}catch(n){i.textContent="Lỗi cú pháp JSON: "+n.message}},300)}function c(n,t="info"){var e=document.getElementById("toast-container")||((e=document.createElement("div")).id="toast-container",e.className="toast-container position-fixed top-0 end-0 p-3",e.style.zIndex="11",document.body.appendChild(e),e),i="success"===t?"text-bg-success":"error"===t?"text-bg-danger":"warning"===t?"text-bg-warning":"info"===t?"text-bg-info":"text-bg-secondary",a="success"===t?"check-line":"error"===t||"warning"===t?"alert-line":"information-line";let h=document.createElement("div");h.className=`toast align-items-center ${i} border-0`,h.setAttribute("role","alert"),h.setAttribute("aria-live","assertive"),h.setAttribute("aria-atomic","true"),h.innerHTML=`
      <div class="d-flex">
        <div class="toast-body">
          <i class="ri-${a} me-1"></i>
          ${n}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `,e.appendChild(h);i=new bootstrap.Toast(h,{autohide:"info"!==t,delay:"info"===t?5e3:3e3});i.show(),h.addEventListener("hidden.bs.toast",()=>{h.remove()})}_.addEventListener("input",C,{passive:!1}),n.addEventListener("click",async function(){try{var t=JSON.parse(_.textContent),n=(delete(h={...h=t}).ai_provider,delete h.model_used,delete h.total_images,delete h.processed_successfully,delete h.failed_images,delete h.processing_time_ms,delete h.processing_time,delete h.processing_errors,o={},h.thong_tin_cong_dan&&Object.assign(o,h.thong_tin_cong_dan),h.thong_tin_gia_dinh&&(o.thong_tin_gia_dinh=JSON.stringify(h.thong_tin_gia_dinh)),h.thong_tin_thanh_vien_trong_ho&&(o.thong_tin_thanh_vien_trong_ho=JSON.stringify(h.thong_tin_thanh_vien_trong_ho)),o),e=(console.log(n),c("Đang lưu dữ liệu...","info"),await addDataToAPI("cong_dan",[n]));if(e.success){c("Lưu dữ liệu thành công!","success"),console.log("API Response:",e);try{let n="";if(t.thong_tin_cong_dan){var a=t.thong_tin_cong_dan;let e="",i=(t.thong_tin_gia_dinh&&Array.isArray(t.thong_tin_gia_dinh)&&0<t.thong_tin_gia_dinh.length&&(e="\n\n👨‍👩‍👧‍👦 THÔNG TIN GIA ĐÌNH:\n",t.thong_tin_gia_dinh.forEach((n,t)=>{e+=`${t+1}. 👤 ${n.ho_ten||"N/A"} - 💼 ${n.moi_quan_he||"N/A"}\n   🆔 CMND/CCCD: ${n.so_CMND||n.so_CCCD||"N/A"}\n`})),"");t.thong_tin_thanh_vien_trong_ho&&Array.isArray(t.thong_tin_thanh_vien_trong_ho)&&0<t.thong_tin_thanh_vien_trong_ho.length&&(i="\n👥 THÀNH VIÊN TRONG HỘ:\n",t.thong_tin_thanh_vien_trong_ho.forEach((n,t)=>{i+=`${t+1}. 👤 ${n.ho_ten||"N/A"} - 🏷️ ${n.quan_he||"N/A"}\n   🆔 CMND/CCCD: ${n.so_CMND||n.so_CCCD||"N/A"}\n`})),n=`🔔 THÔNG BÁO OCR CÔNG DÂN MỚI 🔔
════════════════════════
📋 THÔNG TIN CÁ NHÂN:
👤 Họ và tên: ${a.ho_ten||"N/A"}
🎂 Ngày sinh: ${a.ngay_sinh||"N/A"}
⚧️ Giới tính: ${a.gioi_tinh||"N/A"}
🩸 Nhóm máu: ${a.nhom_mau||"N/A"}
👥 Dân tộc: ${a.dan_toc||"N/A"}
🙏 Tôn giáo: ${a.ton_giao||"N/A"}
💒 Tình trạng hôn nhân: ${a.tinh_trang_hon_nhan||"N/A"}
💼 Nghề nghiệp: ${a.nghe_nghiep||"N/A"}
📞 Số điện thoại: ${a.so_dien_thoai||"N/A"}

🆔 GIẤY TỜ ĐỊNH DANH:
📇 Số CMND: ${a.so_CMND||"N/A"}
🪪 Số CCCD: ${a.so_CCCD||"N/A"}
📅 Ngày cấp: ${a.ngay_cap||"N/A"}
🏛️ Nơi cấp: ${a.noi_cap||"N/A"}

📍 THÔNG TIN ĐỊA CHỈ:
🏠 Quê quán: ${a.que_quan||"N/A"}
📍 Nơi đăng ký khai sinh: ${a.noi_dang_ky_khai_sinh||"N/A"}
🏘️ Nơi thường trú: ${a.noi_thuong_tru||"N/A"}
📌 Nơi ở hiện tại: ${a.noi_o_hien_tai||"N/A"}${e}${i}

✅ Đã cập nhật vào hệ thống thành công!`}else n="🔔 Đã cập nhật thông tin công dân mới vào hệ thống.";var i=["zlw4654055205456626745"];c("Đang gửi thông báo Zalo...","info"),await noti_group_zalo_user(i,n),c("Gửi thông báo Zalo thành công!","success")}catch(n){console.error("Lỗi khi gửi thông báo Zalo:",n),c("Lưu thành công nhưng không thể gửi thông báo Zalo!","warning")}}else c("Lỗi khi lưu dữ liệu: "+e.message,"error")}catch(n){console.error("Error saving data:",n),c("Không thể lưu do lỗi cú pháp JSON!","error")}var h,o}),a.addEventListener("click",function(){confirm("Bạn có chắc chắn muốn xóa tất cả hình ảnh và dữ liệu JSON? Hành động này không thể hoàn tác.")&&(p.removeAllFiles(),_.textContent="",i.textContent="",s(),h(),c("Đã reset thành công!","success"),console.log("✅ Application reset completed"))}),s(),h(),"passive"in EventTarget.prototype&&console.log("Passive event listeners supported");n=document.getElementById("apiKey"),n&&(n.value="AIzaSyCznlhvmp8lBm7YqrKmquW2qTlOurXubPI"),a=document.getElementById("customPrompt");a&&(a.value=v.trim())});