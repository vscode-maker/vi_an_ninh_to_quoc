/**
 * Web App để quản lý công việc
 * Hỗ trợ: Thêm, Sửa, Xóa, Upload Files
 */

const DRIVE_FOLDER_ID = "1jqclDUufjHgZl3ekAPZ972mKfpmGNzDo";
const SHEET_NAME_CONG_VIEC = "cong_viec";
const SHEET_NAME_FILE_ATTACH = "file_attach";
const SHEET_NAME_GROUP = "group";
const SHEET_NAME_SETTING = "Setting";

// Tên sheet chứa thông tin app (access token, etc)
const SHEET_NAME_INFO_APP = "info_app";

// Base URL của web app
const WEB_APP_BASE_URL =
  "https://script.google.com/macros/s/AKfycbz8xDodtPDB6S1OHi2cUtEtvEeGtb0zrAmhSDLAMh2T9f4ZXKyZbYfBu0VyeZPEFO-D/exec";

/**
 * Test function - Verify saveNote exists
 */
function testSaveNote() {
  Logger.log("Test: saveNote function exists");
  return {
    success: true,
    message: "saveNote function is available",
  };
}

// Tên sheet chứa thông tin user
const SHEET_NAME_USER = "user";

/**
 * Hiển thị giao diện web
 */
function doGet(e) {
  // Lấy session ID từ parameter
  var sessionId =
    e && e.parameter && e.parameter.sessionId ? e.parameter.sessionId : null;

  // Kiểm tra session
  var userSession = getUserSession(sessionId);

  // Nếu chưa login, hiển thị trang login
  if (!userSession) {
    return showLoginPage();
  }

  // Đã login, xác định groupId theo vai trò
  var groupId = null;
  var groupIds = [];

  if (userSession.vai_tro === "Admin") {
    // Admin xem tất cả công việc
    groupId = null;
    groupIds = [];
  } else {
    // User xem công việc của TẤT CẢ các group mình quản lý
    // group_id có thể có nhiều group, cách nhau bởi dấu phẩy
    if (userSession.group_id && userSession.group_id.trim() !== "") {
      groupIds = userSession.group_id.split(",").map(function (g) {
        return g.trim();
      });
      // Để tương thích với code cũ, vẫn set groupId = group đầu tiên
      groupId = groupIds.length > 0 ? groupIds[0] : null;
    } else {
      // User không thuộc group nào -> không xem được gì
      groupIds = ["NO_ACCESS"];
      groupId = "NO_ACCESS";
    }
  }

  // Kiểm tra nếu có parameter group_id (dùng cho trường hợp Admin muốn xem group cụ thể)
  if (
    e &&
    e.parameter &&
    e.parameter.group_id &&
    userSession.vai_tro === "Admin"
  ) {
    groupId = e.parameter.group_id.trim();
    groupIds = [groupId];
  }

  // Tạo template và truyền dữ liệu
  var template = HtmlService.createTemplateFromFile("Index");
  template.groupId = groupId;
  template.groupIds = JSON.stringify(groupIds); // Truyền danh sách group_id
  template.userSession = JSON.stringify(userSession); // Truyền thông tin user vào template
  template.webAppUrl = WEB_APP_BASE_URL; // Truyền URL để redirect sau logout

  // PERFORMANCE OPTIMIZATION: Batch load all initial data
  console.log("🚀 Loading initial data with batch API...");
  var initialData = batchLoadAllData(groupIds.length > 0 ? groupIds : groupId);
  template.initialData = JSON.stringify(initialData); // Truyền dữ liệu ban đầu
  console.log("✅ Initial data loaded and passed to template");

  return template
    .evaluate()
    .setTitle("Quản Lý Công Việc")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl(
      "https://i.ibb.co/8b4MvV2/Black-Modern-Software-Programmer-Logo-2.png"
    );
}

/**
 * Hiển thị trang login
 */
function showLoginPage() {
  return HtmlService.createHtmlOutputFromFile("Login")
    .setTitle("Quản Lý Công Việc")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag(
      "viewport",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl(
      "https://i.ibb.co/8b4MvV2/Black-Modern-Software-Programmer-Logo-2.png"
    );
}

/**
 * Xác thực người dùng
 * @param {string} soHieu - Số hiệu
 * @param {string} password - Mật khẩu
 * @return {Object} - Kết quả xác thực
 */
function authenticateUser(soHieu, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_NAME_USER);

    if (!userSheet) {
      return {
        success: false,
        message: 'Không tìm thấy sheet "user"',
      };
    }

    // Lấy tất cả dữ liệu user
    const data = userSheet.getDataRange().getValues();
    const headers = data[0];

    // Tìm index của các cột
    const soHieuIndex = headers.indexOf("so_hieu");
    const passwordIndex = headers.indexOf("password");

    if (soHieuIndex === -1 || passwordIndex === -1) {
      return {
        success: false,
        message: "Cấu trúc sheet user không đúng",
      };
    }

    // Tìm user với số hiệu và password khớp
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userSoHieu = row[soHieuIndex] ? row[soHieuIndex].toString() : "";
      const userPassword = row[passwordIndex]
        ? row[passwordIndex].toString()
        : "";

      if (userSoHieu === soHieu && userPassword === password) {
        // Tìm thấy user, tạo object user
        const user = {};
        headers.forEach((header, index) => {
          user[header] = row[index] || "";
        });

        // Xóa password khỏi object trả về
        delete user.password;

        // Tạo session ID duy nhất
        const sessionId = generateSessionId();

        // Lưu session với session ID
        saveUserSession(user, sessionId);

        // Tạo redirect URL - Sử dụng deployed URL thay vì dev URL
        const redirectUrl = WEB_APP_BASE_URL;

        return {
          success: true,
          message: "Đăng nhập thành công",
          user: user,
          sessionId: sessionId,
          redirectUrl: redirectUrl,
        };
      }
    }

    // Không tìm thấy user
    return {
      success: false,
      message: "Số hiệu hoặc mật khẩu không đúng",
    };
  } catch (error) {
    Logger.log("Error in authenticateUser: " + error.toString());
    return {
      success: false,
      message: "Lỗi: " + error.toString(),
    };
  }
}

/**
 * Tạo session ID ngẫu nhiên
 */
function generateSessionId() {
  return Utilities.getUuid();
}

/**
 * Lưu session người dùng với session ID duy nhất
 * @param {Object} user - Thông tin user
 * @param {string} sessionId - Session ID duy nhất
 */
function saveUserSession(user, sessionId) {
  try {
    var cache = CacheService.getScriptCache();
    var sessionKey = "session_" + sessionId;
    // Lưu session trong 6 giờ (21600 giây)
    cache.put(sessionKey, JSON.stringify(user), 21600);
    return sessionId;
  } catch (error) {
    Logger.log("Error saving session: " + error.toString());
    return null;
  }
}

/**
 * Lấy session người dùng theo session ID
 * @param {string} sessionId - Session ID
 * @return {Object|null} - Thông tin user hoặc null
 */
function getUserSession(sessionId) {
  try {
    if (!sessionId) {
      return null;
    }

    var cache = CacheService.getScriptCache();
    var sessionKey = "session_" + sessionId;
    var sessionData = cache.get(sessionKey);

    if (sessionData) {
      return JSON.parse(sessionData);
    }

    return null;
  } catch (error) {
    Logger.log("Error getting session: " + error.toString());
    return null;
  }
}

/**
 * Đăng xuất - Xóa session theo session ID
 * @param {string} sessionId - Session ID cần xóa
 */
function logout(sessionId) {
  try {
    if (!sessionId) {
      return { success: false, message: "Không tìm thấy session" };
    }

    var cache = CacheService.getScriptCache();
    var sessionKey = "session_" + sessionId;
    cache.remove(sessionKey);
    return { success: true };
  } catch (error) {
    Logger.log("Error in logout: " + error.toString());
    return {
      success: false,
      message: error.toString(),
    };
  }
}

/**
 * Include file HTML/CSS/JS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Lấy thông tin user đang đăng nhập
 */
function getUserInfo() {
  try {
    var user = Session.getActiveUser();
    var email = user.getEmail();

    // Lấy tên từ email (phần trước @)
    var name = email.split("@")[0];

    // Tạo URL avatar từ Google (sử dụng Gmail avatar API)
    var avatarUrl =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(name) +
      "&background=2D8E2B&color=fff&size=128";

    return {
      success: true,
      email: email,
      name: name,
      avatarUrl: avatarUrl,
    };
  } catch (error) {
    Logger.log("Lỗi getUserInfo: " + error.toString());
    return {
      success: false,
      message: "Không thể lấy thông tin user: " + error.toString(),
    };
  }
}

/**
 * Lấy danh sách nhóm từ sheet group
 */
function getGroups() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_GROUP);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_GROUP,
      };
    }

    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return { success: true, data: [] };
    }

    const headers = data[0];
    const rows = data.slice(1);
    const result = [];

    rows.forEach((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      // Only add groups that have a valid group_id
      if (obj.group_id) {
        result.push(obj);
      }
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Lấy dữ liệu từ sheet cong_viec - Lọc theo group_id
 * @param {string|string[]|null} filterGroupId - Có thể là:
 *   - null/undefined: Lấy tất cả dữ liệu (Admin)
 *   - string: Lấy dữ liệu của 1 group (tương thích với code cũ)
 *   - array: Lấy dữ liệu của nhiều group (User có nhiều group)
 */
function getDataFromSheet(filterGroupId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return { success: true, data: [] };
    }

    const headers = data[0];
    const rows = data.slice(1);
    const groupIdIndex = headers.indexOf("group_id");
    const idUniqueIndex = headers.indexOf("id_unique");

    if (groupIdIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột group_id trong sheet",
      };
    }

    // id_unique và index_row là optional - để backward compatibility
    // Không bắt lỗi nếu không tìm thấy

    // Chuẩn hoá filterGroupId thành mảng để dễ xử lý
    var filterGroupIds = [];
    if (filterGroupId) {
      if (Array.isArray(filterGroupId)) {
        filterGroupIds = filterGroupId;
      } else {
        filterGroupIds = [filterGroupId];
      }
    }

    // Nếu user không có quyền truy cập (NO_ACCESS), trả về rỗng ngay
    if (filterGroupIds.length === 1 && filterGroupIds[0] === "NO_ACCESS") {
      return { success: true, data: [] };
    }

    const result = [];

    rows.forEach((row, index) => {
      var shouldInclude = false;

      // Nếu không có filterGroupIds (Admin) => Lấy tất cả
      if (filterGroupIds.length === 0) {
        shouldInclude = true;
      } else {
        // Kiểm tra xem group_id của row có nằm trong danh sách filterGroupIds không
        var rowGroupId = row[groupIdIndex];
        shouldInclude = filterGroupIds.indexOf(rowGroupId) !== -1;
      }

      if (shouldInclude) {
        const obj = {};
        headers.forEach((header, i) => {
          const value = row[i];

          // Convert Date objects sang string format dd/mm/yyyy
          if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, "0");
            const month = String(value.getMonth() + 1).padStart(2, "0");
            const year = value.getFullYear();

            // Nếu là cột thoi_han, chỉ lưu ngày
            if (header === "thoi_han") {
              obj[header] = `${day}/${month}/${year}`;
            }
            // Nếu là cột ngay_gio_ghi_chu hoặc upload_date, lưu cả giờ
            else if (
              header === "ngay_gio_ghi_chu" ||
              header === "upload_date"
            ) {
              const hours = String(value.getHours()).padStart(2, "0");
              const minutes = String(value.getMinutes()).padStart(2, "0");
              obj[header] = `${day}/${month}/${year} ${hours}:${minutes}`;
            }
            // Các date khác (nếu có)
            else {
              obj[header] = `${day}/${month}/${year}`;
            }
          } else {
            obj[header] = value || "";
          }
        });
        result.push(obj);
      }
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Lấy dữ liệu từ sheet Setting theo type
 * @param {string} type - Loại setting cần lấy (ví dụ: "Đối tượng thực hiện")
 * @return {Object} - Kết quả với mảng các giá trị
 */
function getSettingByType(type) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_SETTING);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_SETTING,
      };
    }

    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return { success: true, data: [] };
    }

    const headers = data[0];
    const typeIndex = headers.indexOf("type");
    const valueIndex = headers.indexOf("value");

    if (typeIndex === -1 || valueIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột type hoặc value trong sheet Setting",
      };
    }

    // Lọc các dòng có type khớp
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[typeIndex] === type && row[valueIndex]) {
        result.push(row[valueIndex].toString());
      }
    }

    return { success: true, data: result };
  } catch (error) {
    Logger.log("Error in getSettingByType: " + error.toString());
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Thêm công việc mới
 */
function addTask(taskData, currentGroupId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_CONG_VIEC,
      };
    }

    // Sử dụng currentGroupId từ session thay vì tạo mới
    taskData.group_id = currentGroupId;

    // Tạo ID unique cho task (không đổi dù xóa dòng)
    taskData.id_unique = generateGroupId();

    // Thêm timestamp với format dd/mm/yyyy hh:mm
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    taskData.ngay_gio_ghi_chu = `${day}/${month}/${year} ${hours}:${minutes}`;

    // Lấy headers
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    // Tính index_row mới (số dòng cuối + 1) - Giữ lại để tương thích
    const lastRow = sheet.getLastRow();
    taskData.index_row = lastRow + 1;

    // Tạo row mới theo thứ tự headers
    const newRow = headers.map((header) => taskData[header] || "");

    // Thêm vào sheet
    sheet.appendRow(newRow);

    // Gửi thông báo Zalo (không block nếu lỗi)
    try {
      guiThongBaoCongViecMoi(taskData, currentGroupId, taskData.id_unique);
    } catch (notificationError) {
      Logger.log(
        "Lỗi gửi thông báo Zalo (không ảnh hưởng task): " +
          notificationError.toString()
      );
    }

    return {
      success: true,
      message: "Thêm công việc thành công!",
      id_unique: taskData.id_unique,
      index_row: taskData.index_row, // Giữ lại để tương thích
      group_id: taskData.group_id,
    };
  } catch (error) {
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Cập nhật công việc - Tìm theo id_unique
 * @param {string} idUnique - ID unique của task
 * @param {Object} taskData - Dữ liệu cập nhật
 */
function updateTask(idUnique, taskData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idUniqueIndex = headers.indexOf("id_unique");

    if (idUniqueIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột id_unique trong sheet",
      };
    }

    // Tìm dòng có id_unique tương ứng
    let actualRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idUniqueIndex] == idUnique) {
        actualRow = i + 1; // +1 vì sheet bắt đầu từ 1
        break;
      }
    }

    if (actualRow === -1) {
      return {
        success: false,
        message: "Không tìm thấy công việc với id_unique: " + idUnique,
      };
    }

    // Cập nhật timestamp với format dd/mm/yyyy hh:mm
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    taskData.ngay_gio_ghi_chu = `${day}/${month}/${year} ${hours}:${minutes}`;

    // Cập nhật từng cell theo header (không cập nhật id_unique và index_row)
    headers.forEach((header, index) => {
      if (
        taskData.hasOwnProperty(header) &&
        header !== "id_unique" &&
        header !== "index_row"
      ) {
        sheet.getRange(actualRow, index + 1).setValue(taskData[header]);
      }
    });

    return { success: true, message: "Cập nhật thành công!" };
  } catch (error) {
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Xóa công việc - Tìm theo id_unique
 * @param {string} idUnique - ID unique của task
 */
function deleteTask(idUnique) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idUniqueIndex = headers.indexOf("id_unique");

    if (idUniqueIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột id_unique trong sheet",
      };
    }

    // Tìm dòng có id_unique tương ứng
    let actualRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idUniqueIndex] == idUnique) {
        actualRow = i + 1; // +1 vì sheet bắt đầu từ 1
        break;
      }
    }

    if (actualRow === -1) {
      return {
        success: false,
        message: "Không tìm thấy công việc với id_unique: " + idUnique,
      };
    }

    sheet.deleteRow(actualRow);

    return { success: true, message: "Xóa thành công!" };
  } catch (error) {
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Cập nhật trạng thái công việc - Dùng cho drag & drop
 * @param {string} idUnique - ID unique của task
 * @param {string} groupId - Group ID
 * @param {string} newStatus - Trạng thái mới
 */
function updateTaskStatus(idUnique, groupId, newStatus) {
  try {
    // Log để debug
    Logger.log("updateTaskStatus called with:");
    Logger.log("  idUnique: " + idUnique + " (type: " + typeof idUnique + ")");
    Logger.log("  groupId: " + groupId);
    Logger.log("  newStatus: " + newStatus);

    // Validate input
    if (!idUnique || idUnique === "undefined" || idUnique === "null") {
      return {
        success: false,
        message: "Thiếu id_unique",
      };
    }

    if (!newStatus) {
      return {
        success: false,
        message: "Thiếu trạng thái mới",
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet: " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idUniqueIndex = headers.indexOf("id_unique");
    const statusIndex = headers.indexOf("trang_thai");

    if (idUniqueIndex === -1 || statusIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột id_unique hoặc trang_thai trong sheet",
      };
    }

    // Tìm dòng có id_unique tương ứng
    let actualRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idUniqueIndex]) === String(idUnique)) {
        actualRow = i + 1; // +1 vì sheet bắt đầu từ 1
        break;
      }
    }

    if (actualRow === -1) {
      Logger.log("Không tìm thấy id_unique: " + idUnique);
      Logger.log(
        "Danh sách id_unique có: " +
          data
            .slice(1)
            .map((row) => row[idUniqueIndex])
            .join(", ")
      );
      return {
        success: false,
        message: "Không tìm thấy công việc với id_unique: " + idUnique,
      };
    }

    // Chuẩn hóa trạng thái - trim và normalize Unicode
    var normalizedStatus = String(newStatus).trim();

    // Map các trạng thái để đảm bảo khớp với data validation
    var statusMap = {
      "Chưa thực hiện": "Chưa thực hiện",
      "Chờ kết quả": "Chờ kết quả",
      "Hoàn thành": "Hoàn thành",
    };

    // Tìm trạng thái khớp (case-insensitive và trim)
    var finalStatus = normalizedStatus;
    for (var key in statusMap) {
      if (normalizedStatus.toLowerCase() === key.toLowerCase()) {
        finalStatus = statusMap[key];
        break;
      }
    }

    Logger.log("Normalized status: '" + finalStatus + "'");

    // Cập nhật trạng thái
    sheet.getRange(actualRow, statusIndex + 1).setValue(finalStatus);

    Logger.log(
      "Cập nhật thành công row " + actualRow + " với trạng thái: " + finalStatus
    );

    return {
      success: true,
      message: "Cập nhật trạng thái thành công!",
      newStatus: finalStatus,
    };
  } catch (error) {
    Logger.log("Lỗi updateTaskStatus: " + error.toString());
    return {
      success: false,
      message: "Lỗi: " + error.toString(),
    };
  }
}

/**
 * Upload files lên Drive
 */
function uploadFiles(filesData, groupId, nguoiGhiChu, tenNguoiGhiChu) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const attachSheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);

    if (!attachSheet) {
      // Tạo sheet file_attach nếu chưa có
      const newSheet = ss.insertSheet(SHEET_NAME_FILE_ATTACH);
      newSheet.appendRow([
        "group_id",
        "ten_nguoi_ghi_chu",
        "file_name",
        "file_url",
        "file_type",
        "upload_date",
      ]);
    }

    const uploadedFiles = [];

    filesData.forEach((fileData) => {
      // Decode base64
      const content = Utilities.newBlob(
        Utilities.base64Decode(fileData.content),
        fileData.mimeType,
        fileData.name
      );

      // Upload lên Drive
      const file = folder.createFile(content);

      // Lưu thông tin vào sheet file_attach
      const attachSheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);
      attachSheet.appendRow([
        groupId,
        nguoiGhiChu,
        tenNguoiGhiChu,
        file.getName(),
        file.getUrl(),
        file.getMimeType(),
        new Date(),
      ]);

      uploadedFiles.push({
        name: file.getName(),
        url: file.getUrl(),
        type: file.getMimeType(),
      });
    });

    return {
      success: true,
      message: "Upload thành công " + uploadedFiles.length + " file!",
      files: uploadedFiles,
    };
  } catch (error) {
    return { success: false, message: "Lỗi upload: " + error.toString() };
  }
}

/**
 * Lấy danh sách file đính kèm theo id_unique
 * @param {string} idUnique - id_unique của task
 * @param {string} groupId - Group ID (không dùng, giữ lại để tương thích)
 */
function getFileAttachments(idUnique, groupId) {
  try {
    Logger.log("getFileAttachments called with idUnique: " + idUnique);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);

    if (!sheet) {
      Logger.log("Sheet file_attach không tồn tại");
      return { success: true, data: [] };
    }

    const data = sheet.getDataRange().getValues();
    Logger.log("Total rows in sheet: " + data.length);

    if (data.length <= 1) {
      Logger.log("Sheet rỗng hoặc chỉ có header");
      return { success: true, data: [] };
    }

    const headers = data[0];
    Logger.log("Headers: " + JSON.stringify(headers));

    const idUniqueIndex = headers.indexOf("id_unique");
    Logger.log("id_unique column position: " + idUniqueIndex);

    if (idUniqueIndex === -1) {
      Logger.log("Không tìm thấy cột id_unique");
      return { success: true, data: [] };
    }

    const files = [];
    for (let i = 1; i < data.length; i++) {
      Logger.log(
        "Row " +
          i +
          " id_unique value: " +
          data[i][idUniqueIndex] +
          " (comparing with " +
          idUnique +
          ")"
      );

      // Chỉ filter theo id_unique
      if (data[i][idUniqueIndex] == idUnique) {
        Logger.log("Match found at row " + i);

        const fileObj = {};
        headers.forEach((header, index) => {
          const value = data[i][index];
          // Convert Date objects to ISO string để có thể serialize
          if (value instanceof Date) {
            fileObj[header] = value.toISOString();
          } else {
            fileObj[header] = value;
          }
        });

        // Map lại tên field để tương thích với frontend
        // Nếu sheet cũ dùng tên khác, map sang tên mới
        if (fileObj.link_file && !fileObj.file_url) {
          fileObj.file_url = fileObj.link_file;
        }
        if (fileObj.loai_file && !fileObj.mime_type) {
          fileObj.mime_type = fileObj.loai_file;
        }
        if (fileObj.id && !fileObj.group_id) {
          fileObj.group_id = fileObj.id;
        }
        if (fileObj.ngay_update && !fileObj.upload_date) {
          fileObj.upload_date = fileObj.ngay_update;
        }

        files.push(fileObj);
      }
    }

    Logger.log("Total files found: " + files.length);

    const result = { success: true, data: files };
    Logger.log("Returning result with " + files.length + " files");

    return result;
  } catch (error) {
    Logger.log("Error in getFileAttachments: " + error.toString());
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Lấy TẤT CẢ file attachments từ sheet file_attach
 * Trả về dạng object với key là id_unique, value là mảng files
 * Dùng để cache toàn bộ dữ liệu ở client
 */
function getAllFileAttachments() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);

    if (!sheet) {
      Logger.log("Sheet file_attach không tồn tại");
      return { success: true, data: {} };
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      Logger.log("Sheet rỗng hoặc chỉ có header");
      return { success: true, data: {} };
    }

    const headers = data[0];
    const idUniqueIndex = headers.indexOf("id_unique");

    if (idUniqueIndex === -1) {
      Logger.log("Không tìm thấy cột id_unique");
      return { success: true, data: {} };
    }

    // Tổ chức dữ liệu theo id_unique
    const filesByIdUnique = {};

    for (let i = 1; i < data.length; i++) {
      const idUnique = data[i][idUniqueIndex];

      if (!idUnique) continue; // Bỏ qua row không có id_unique

      const fileObj = {};
      headers.forEach((header, index) => {
        const value = data[i][index];
        // Convert Date objects to ISO string
        if (value instanceof Date) {
          fileObj[header] = value.toISOString();
        } else {
          fileObj[header] = value;
        }
      });

      // Map lại tên field để tương thích
      if (fileObj.link_file && !fileObj.file_url) {
        fileObj.file_url = fileObj.link_file;
      }
      if (fileObj.loai_file && !fileObj.mime_type) {
        fileObj.mime_type = fileObj.loai_file;
      }
      if (fileObj.id && !fileObj.group_id) {
        fileObj.group_id = fileObj.id;
      }
      if (fileObj.ngay_update && !fileObj.upload_date) {
        fileObj.upload_date = fileObj.ngay_update;
      }

      // Thêm file vào mảng của id_unique tương ứng
      if (!filesByIdUnique[idUnique]) {
        filesByIdUnique[idUnique] = [];
      }
      filesByIdUnique[idUnique].push(fileObj);
    }

    Logger.log(
      "Loaded files for " + Object.keys(filesByIdUnique).length + " tasks"
    );

    return { success: true, data: filesByIdUnique };
  } catch (error) {
    Logger.log("Error in getAllFileAttachments: " + error.toString());
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

/**
 * Sinh group_id ngẫu nhiên
 */
function generateGroupId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Upload files cho một task cụ thể (theo id_unique)
 * Mỗi file sẽ được lưu thành một row riêng trong sheet file_attach
 * @param {string} idUnique - id_unique của task
 * @param {Array} filesData - Mảng các file {name, mimeType, data}
 * @param {string} ghiChu - Ghi chú cho tất cả các file
 * @param {string} groupId - Group ID
 * @param {Array} thongTinThem - Mảng các object thông tin thêm (optional)
 */
function uploadTaskFiles(idUnique, filesData, ghiChu, groupId, thongTinThem) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let attachSheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);

    // Tạo sheet file_attach nếu chưa có
    if (!attachSheet) {
      attachSheet = ss.insertSheet(SHEET_NAME_FILE_ATTACH);
      attachSheet.appendRow([
        "id_unique",
        "name_file",
        "id_file",
        "ghi_chu",
        "group_id",
        "upload_date",
        "file_url",
        "mime_type",
        "thong_tin_them",
      ]);
    }

    // Kiểm tra xem có cột thong_tin_them chưa
    const headers = attachSheet
      .getRange(1, 1, 1, attachSheet.getLastColumn())
      .getValues()[0];
    const thongTinThemIndex = headers.indexOf("thong_tin_them");

    // Nếu chưa có cột thong_tin_them thì thêm vào
    if (thongTinThemIndex === -1) {
      attachSheet
        .getRange(1, attachSheet.getLastColumn() + 1)
        .setValue("thong_tin_them");
    }

    const uploadedFiles = [];
    const uploadDate = new Date();

    // Convert thông tin thêm thành JSON string
    const thongTinThemJSON =
      thongTinThem && thongTinThem.length > 0
        ? JSON.stringify(thongTinThem)
        : "";

    // Upload từng file và lưu thành row riêng
    filesData.forEach((fileData) => {
      try {
        // Decode base64 và tạo blob
        const content = Utilities.newBlob(
          Utilities.base64Decode(fileData.data),
          fileData.mimeType,
          fileData.name
        );

        // Upload lên Drive
        const file = folder.createFile(content);

        // Lưu thông tin vào sheet file_attach (mỗi file một row)
        attachSheet.appendRow([
          idUnique, // id_unique thay vì index_row
          file.getName(), // name_file
          file.getId(), // id_file
          ghiChu || "", // ghi_chu (cùng ghi chú cho tất cả file)
          groupId, // group_id
          uploadDate, // upload_date
          file.getUrl(), // file_url
          file.getMimeType(), // mime_type
          thongTinThemJSON, // thong_tin_them (JSON string)
        ]);

        uploadedFiles.push({
          name: file.getName(),
          id: file.getId(),
          url: file.getUrl(),
          type: file.getMimeType(),
        });
      } catch (fileError) {
        Logger.log(
          "Lỗi upload file " + fileData.name + ": " + fileError.toString()
        );
      }
    });

    if (uploadedFiles.length === 0) {
      return {
        success: false,
        message: "Không có file nào được upload thành công",
      };
    }

    return {
      success: true,
      message: `Upload thành công ${uploadedFiles.length}/${filesData.length} file!`,
      files: uploadedFiles,
    };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi upload: " + error.toString(),
    };
  }
}

/**
 * Lưu thông tin thêm mà không có file đính kèm
 * @param {string} idUnique - id_unique của task
 * @param {Array} thongTinThem - Mảng các object thông tin thêm
 * @param {string} ghiChu - Ghi chú
 * @param {string} groupId - Group ID
 */
function saveThongTinThem(idUnique, thongTinThem, ghiChu, groupId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let attachSheet = ss.getSheetByName(SHEET_NAME_FILE_ATTACH);

    // Tạo sheet file_attach nếu chưa có
    if (!attachSheet) {
      attachSheet = ss.insertSheet(SHEET_NAME_FILE_ATTACH);
      attachSheet.appendRow([
        "id_unique",
        "name_file",
        "id_file",
        "ghi_chu",
        "group_id",
        "upload_date",
        "file_url",
        "mime_type",
        "thong_tin_them",
      ]);
    }

    // Kiểm tra xem có cột thong_tin_them chưa
    const headers = attachSheet
      .getRange(1, 1, 1, attachSheet.getLastColumn())
      .getValues()[0];
    const thongTinThemIndex = headers.indexOf("thong_tin_them");

    // Nếu chưa có cột thong_tin_them thì thêm vào
    if (thongTinThemIndex === -1) {
      attachSheet
        .getRange(1, attachSheet.getLastColumn() + 1)
        .setValue("thong_tin_them");
    }

    if (!thongTinThem || thongTinThem.length === 0) {
      return {
        success: false,
        message: "Không có thông tin để lưu",
      };
    }

    const uploadDate = new Date();
    const thongTinThemJSON = JSON.stringify(thongTinThem);

    // Lưu thông tin mà không có file
    attachSheet.appendRow([
      idUnique, // id_unique thay vì index_row
      "", // name_file (rỗng vì không có file)
      "", // id_file (rỗng)
      ghiChu || "", // ghi_chu
      groupId, // group_id
      uploadDate, // upload_date
      "", // file_url (rỗng)
      "", // mime_type (rỗng)
      thongTinThemJSON, // thong_tin_them (JSON string)
    ]);

    return {
      success: true,
      message: `Lưu thành công ${thongTinThem.length} thông tin!`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi lưu thông tin: " + error.toString(),
    };
  }
}

/**
 * Lưu ghi chú vào cột ghi_chu của bảng cong_viec
 * @param {string} idUnique - id_unique của task
 * @param {string} groupId - Group ID
 * @param {string} newNoteJSON - JSON string của ghi chú mới {thoi_gian, noi_dung}
 * @return {object} - Kết quả lưu
 */
function saveNote(idUnique, groupId, newNoteJSON) {
  try {
    Logger.log(
      "saveNote called with idUnique: " + idUnique + ", groupId: " + groupId
    );
    Logger.log("newNoteJSON: " + newNoteJSON);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet " + SHEET_NAME_CONG_VIEC,
      };
    }

    // Tìm dòng dữ liệu
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Tìm index của các cột cần thiết
    const idUniqueIndex = headers.indexOf("id_unique");
    const groupIdIndex = headers.indexOf("group_id");
    const ghiChuIndex = headers.indexOf("ghi_chu");

    if (idUniqueIndex === -1 || groupIdIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột id_unique hoặc group_id",
      };
    }

    // Kiểm tra xem có cột ghi_chu chưa, nếu chưa thì tạo
    let actualGhiChuIndex = ghiChuIndex;
    if (ghiChuIndex === -1) {
      const lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue("ghi_chu");
      actualGhiChuIndex = lastCol;
    }

    // Tìm dòng cần cập nhật
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idUniqueIndex] == idUnique &&
        data[i][groupIdIndex] == groupId
      ) {
        targetRow = i + 1; // +1 vì Google Sheets bắt đầu từ 1
        break;
      }
    }

    if (targetRow === -1) {
      return {
        success: false,
        message: "Không tìm thấy công việc",
      };
    }

    // Lấy dữ liệu ghi chú hiện tại
    const currentGhiChu = sheet
      .getRange(targetRow, actualGhiChuIndex + 1)
      .getValue();

    // Parse ghi chú hiện tại
    let notesArray = [];
    if (currentGhiChu && currentGhiChu.trim() !== "") {
      try {
        notesArray = JSON.parse(currentGhiChu);
        if (!Array.isArray(notesArray)) {
          notesArray = [];
        }
      } catch (e) {
        // Nếu không parse được, khởi tạo mảng mới
        notesArray = [];
      }
    }

    // Thêm ghi chú mới vào mảng
    const newNote = JSON.parse(newNoteJSON);
    notesArray.push(newNote);

    // Lưu lại vào sheet
    const updatedGhiChu = JSON.stringify(notesArray);
    sheet.getRange(targetRow, actualGhiChuIndex + 1).setValue(updatedGhiChu);

    Logger.log("Saved successfully. Total notes: " + notesArray.length);

    return {
      success: true,
      message: "Lưu ghi chú thành công",
      ghi_chu: updatedGhiChu,
    };
  } catch (error) {
    Logger.log("Error in saveNote: " + error.toString());
    return {
      success: false,
      message: "Lỗi lưu ghi chú: " + error.toString(),
    };
  }
}

/**
 * Cập nhật ghi chú theo thời gian
 * @param {string} idUnique - ID unique của task
 * @param {string} groupId - Group ID
 * @param {string} thoiGian - Thời gian của ghi chú cần cập nhật
 * @param {string} noiDungMoi - Nội dung mới
 */
function updateNote(idUnique, groupId, thoiGian, noiDungMoi, sessionId) {
  try {
    // Kiểm tra quyền Admin hoặc user (case insensitive)
    const userSession = getUserSession(sessionId);
    const userRole = userSession?.vai_tro?.toLowerCase() || "";
    if (!userSession || (userRole !== "admin" && userRole !== "user")) {
      return {
        success: false,
        message: "Bạn không có quyền sửa ghi chú",
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idUniqueIndex = headers.indexOf("id_unique");
    const groupIdIndex = headers.indexOf("group_id");
    const ghiChuIndex = headers.indexOf("ghi_chu");

    if (idUniqueIndex === -1 || groupIdIndex === -1 || ghiChuIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột cần thiết",
      };
    }

    // Tìm dòng cần cập nhật
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idUniqueIndex] == idUnique &&
        data[i][groupIdIndex] == groupId
      ) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return {
        success: false,
        message: "Không tìm thấy công việc",
      };
    }

    // Lấy và parse ghi chú hiện tại
    const currentGhiChu = sheet.getRange(targetRow, ghiChuIndex + 1).getValue();
    let notesArray = [];

    if (currentGhiChu && currentGhiChu.trim() !== "") {
      try {
        notesArray = JSON.parse(currentGhiChu);
        if (!Array.isArray(notesArray)) {
          notesArray = [];
        }
      } catch (e) {
        return {
          success: false,
          message: "Lỗi parse dữ liệu ghi chú",
        };
      }
    }

    // Tìm và cập nhật ghi chú
    let found = false;
    for (let i = 0; i < notesArray.length; i++) {
      if (notesArray[i].thoi_gian === thoiGian) {
        notesArray[i].noi_dung = noiDungMoi;
        found = true;
        break;
      }
    }

    if (!found) {
      return {
        success: false,
        message: "Không tìm thấy ghi chú cần sửa",
      };
    }

    // Lưu lại
    const updatedGhiChu = JSON.stringify(notesArray);
    sheet.getRange(targetRow, ghiChuIndex + 1).setValue(updatedGhiChu);

    return {
      success: true,
      message: "Cập nhật ghi chú thành công",
      ghi_chu: updatedGhiChu,
    };
  } catch (error) {
    Logger.log("Error in updateNote: " + error.toString());
    return {
      success: false,
      message: "Lỗi cập nhật ghi chú: " + error.toString(),
    };
  }
}

/**
 * Xóa ghi chú theo thời gian
 * @param {string} idUnique - ID unique của task
 * @param {string} groupId - Group ID
 * @param {string} thoiGian - Thời gian của ghi chú cần xóa
 * @param {string} sessionId - Session ID để kiểm tra quyền
 */
function deleteNote(idUnique, groupId, thoiGian, sessionId) {
  try {
    // Kiểm tra quyền Admin hoặc user (case insensitive)
    const userSession = getUserSession(sessionId);
    const userRole = userSession?.vai_tro?.toLowerCase() || "";
    if (!userSession || (userRole !== "admin" && userRole !== "user")) {
      return {
        success: false,
        message: "Bạn không có quyền xóa ghi chú",
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_CONG_VIEC);

    if (!sheet) {
      return {
        success: false,
        message: "Không tìm thấy sheet " + SHEET_NAME_CONG_VIEC,
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idUniqueIndex = headers.indexOf("id_unique");
    const groupIdIndex = headers.indexOf("group_id");
    const ghiChuIndex = headers.indexOf("ghi_chu");

    if (idUniqueIndex === -1 || groupIdIndex === -1 || ghiChuIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột cần thiết",
      };
    }

    // Tìm dòng cần cập nhật
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idUniqueIndex] == idUnique &&
        data[i][groupIdIndex] == groupId
      ) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return {
        success: false,
        message: "Không tìm thấy công việc",
      };
    }

    // Lấy và parse ghi chú hiện tại
    const currentGhiChu = sheet.getRange(targetRow, ghiChuIndex + 1).getValue();
    let notesArray = [];

    if (currentGhiChu && currentGhiChu.trim() !== "") {
      try {
        notesArray = JSON.parse(currentGhiChu);
        if (!Array.isArray(notesArray)) {
          notesArray = [];
        }
      } catch (e) {
        return {
          success: false,
          message: "Lỗi parse dữ liệu ghi chú",
        };
      }
    }

    // Lọc bỏ ghi chú cần xóa
    const originalLength = notesArray.length;
    notesArray = notesArray.filter((note) => note.thoi_gian !== thoiGian);

    if (notesArray.length === originalLength) {
      return {
        success: false,
        message: "Không tìm thấy ghi chú cần xóa",
      };
    }

    // Lưu lại
    const updatedGhiChu = JSON.stringify(notesArray);
    sheet.getRange(targetRow, ghiChuIndex + 1).setValue(updatedGhiChu);

    return {
      success: true,
      message: "Xóa ghi chú thành công",
      ghi_chu: updatedGhiChu,
    };
  } catch (error) {
    Logger.log("Error in deleteNote: " + error.toString());
    return {
      success: false,
      message: "Lỗi xóa ghi chú: " + error.toString(),
    };
  }
}

/**
 * Gửi thông báo vào nhóm Zalo khi có công việc mới
 * @param {Object} taskData - Dữ liệu công việc vừa tạo
 * @param {string} groupId - ID nhóm Zalo
 * @param {string} idUnique - id_unique của task
 */
function guiThongBaoCongViecMoi(taskData, groupId, idUnique) {
  try {
    // Lấy access token từ sheet info_app
    const infoApp = getInfoApp();
    if (!infoApp || infoApp.length < 3) {
      Logger.log("Không tìm thấy thông tin access token trong sheet info_app");
      return { success: false, message: "Thiếu access token" };
    }

    const accessToken = infoApp[2][1]; // Access token ở dòng 3, cột 2

    if (!accessToken) {
      Logger.log("Access token rỗng");
      return { success: false, message: "Access token rỗng" };
    }

    // Tạo nội dung thông báo
    let noiDung = "🆕 CÔNG VIỆC MỚI\n";
    noiDung += "━━━━━━━━━━━━━━━━━\n\n";

    // Thông tin nhóm
    if (taskData.nhom) {
      noiDung += `📋 Nhóm: ${taskData.nhom}\n`;
    }

    // Loại yêu cầu
    noiDung += `📌 Yêu cầu: ${taskData.yeu_cau || "Chưa xác định"}\n`;

    // Đối tượng (bỏ qua nếu yêu cầu là "Uỷ thác điều tra")
    if (taskData.yeu_cau !== "Uỷ thác điều tra") {
      noiDung += `👤 Đối tượng: ${
        taskData.ho_ten_doi_tuong || "Chưa có thông tin"
      }\n`;
    }

    // Người ghi chú
    noiDung += `✍️ Người tạo: ${
      taskData.ten_nguoi_ghi_chu || "Chưa có thông tin"
    }\n`;

    // Đơn vị thực hiện (nếu có)
    if (taskData.don_vi_thuc_hien) {
      noiDung += `🏢 Đơn vị thực hiện: ${taskData.don_vi_thuc_hien}\n`;
    }

    // Thời hạn (nếu có)
    if (taskData.thoi_han) {
      noiDung += `⏰ Thời hạn: ${taskData.thoi_han}\n`;
    }

    // Trạng thái
    noiDung += `📊 Trạng thái: ${taskData.trang_thai || "Chưa thực hiện"}\n`;

    noiDung += "\n━━━━━━━━━━━━━━━━━\n";

    // Chi tiết theo loại yêu cầu
    const bankCategories = [
      "Sao kê",
      "Cung cấp thông tin",
      "Cung cấp IP",
      "Cung cấp hình ảnh",
    ];
    const sdtCategories = ["Rút list", "Quét Imei", "Giám sát", "Định vị"];
    const zaloCategories = ["Cung cấp thông tin Zalo", "Cung cấp IP Zalo"];
    const congVanCategories = ["Công văn", "Uỷ thác điều tra"];
    const xacMinhCategories = [
      "Xác minh phương tiện",
      "Xác minh đối tượng",
      "Vẽ sơ đồ đường dây",
      "Khác",
    ];

    if (bankCategories.indexOf(taskData.yeu_cau) !== -1) {
      noiDung += "💳 THÔNG TIN BANK:\n";
      if (taskData.ten_tai_khoan)
        noiDung += `• Tên TK: ${taskData.ten_tai_khoan}\n`;
      if (taskData.so_tai_khoan)
        noiDung += `• Số TK: ${taskData.so_tai_khoan}\n`;
      if (taskData.ngan_hang) noiDung += `• Ngân hàng: ${taskData.ngan_hang}\n`;
      if (taskData.ghi_chu) noiDung += `• Diễn giải: ${taskData.ghi_chu}\n`;
    } else if (sdtCategories.indexOf(taskData.yeu_cau) !== -1) {
      noiDung += "📱 THÔNG TIN SĐT:\n";
      if (taskData.so_dien_thoai)
        noiDung += `• SĐT: ${taskData.so_dien_thoai}\n`;
      if (taskData.nha_mang) noiDung += `• Nhà mạng: ${taskData.nha_mang}\n`;
      if (taskData.ghi_chu) noiDung += `• Diễn giải: ${taskData.ghi_chu}\n`;
    } else if (zaloCategories.indexOf(taskData.yeu_cau) !== -1) {
      noiDung += "📱 THÔNG TIN ZALO:\n";
      if (taskData.so_dien_thoai)
        noiDung += `• SĐT: ${taskData.so_dien_thoai}\n`;
      if (taskData.nha_mang) noiDung += `• Nhà mạng: ${taskData.nha_mang}\n`;
      if (taskData.qr_code) noiDung += `• QR Code: ${taskData.qr_code}\n`;
      if (taskData.ten_tai_khoan_mxh)
        noiDung += `• Tên TK MXH: ${taskData.ten_tai_khoan_mxh}\n`;
      if (taskData.ghi_chu) noiDung += `• Diễn giải: ${taskData.ghi_chu}\n`;
    } else if (congVanCategories.indexOf(taskData.yeu_cau) !== -1) {
      noiDung += "📄 THÔNG TIN CÔNG VĂN:\n";
      if (taskData.thong_tin_van_ban)
        noiDung += `• Văn bản: ${taskData.thong_tin_van_ban}\n`;
      if (taskData.ghi_chu) noiDung += `• Diễn giải: ${taskData.ghi_chu}\n`;
    } else if (xacMinhCategories.indexOf(taskData.yeu_cau) !== -1) {
      noiDung += "📝 THÔNG TIN XÁC MINH:\n";
      if (taskData.ghi_chu) noiDung += `• Diễn giải: ${taskData.ghi_chu}\n`;
    }

    noiDung += "\n━━━━━━━━━━━━━━━━━\n";

    // Link xử lý
    const linkGui = groupId
      ? `${WEB_APP_BASE_URL}?group_id=${groupId}`
      : WEB_APP_BASE_URL;
    noiDung += `🔗 Link xử lý: ${linkGui}\n\n`;
    noiDung += "📤 Gửi từ hệ thống PC01 ✅";

    // Tạo payload gửi API Zalo
    const payload = {
      recipient: {
        group_id: groupId,
      },
      message: {
        text: noiDung,
      },
    };

    const options = {
      method: "POST",
      headers: {
        access_token: accessToken,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    // Gửi tin nhắn
    const response = UrlFetchApp.fetch(
      "https://openapi.zalo.me/v3.0/oa/group/message",
      options
    );

    const result = JSON.parse(response.getContentText());

    if (result.error === 0) {
      Logger.log(
        `✅ Gửi thông báo nhóm ${taskData.nhom} (${groupId}) thành công`
      );
      return {
        success: true,
        message: "Gửi thông báo Zalo thành công",
      };
    } else {
      Logger.log(`⚠️ Lỗi gửi Zalo: ${result.message || "Unknown error"}`);
      return {
        success: false,
        message: result.message || "Lỗi không xác định",
      };
    }
  } catch (error) {
    Logger.log(`⚠️ Lỗi kết nối Zalo: ${error.toString()}`);
    return {
      success: false,
      message: "Lỗi kết nối: " + error.toString(),
    };
  }
}

/**
 * Stub function for Zalo OA Groups sync
 * This function is called by the sync button but doesn't have actual implementation yet
 */
function getZaloOAGroupsList() {
  try {
    // For now, return a message indicating this feature is not implemented
    return {
      success: false,
      message: "Tính năng đồng bộ nhóm Zalo chưa được triển khai",
    };
  } catch (error) {
    console.error("Error in getZaloOAGroupsList:", error);
    return {
      success: false,
      message: "Lỗi: " + error.toString(),
    };
  }
}

/**
 * PERFORMANCE OPTIMIZATION: Use Sheets API batch get for optimal performance
 * @param {string} spreadsheetsID - The spreadsheet ID
 * @param {string[]} rangeReads - Array of ranges to read
 * @return {Object} - Batch get response with valueRanges
 */
function readData(spreadsheetsID, rangeReads) {
  var spreadsheetsID = "1sSMNP4LT3LXaLzZJi_ptW6GVpMkermV5Yt7RiI0djYY";
  console.log(
    "📊 Batch reading spreadsheet:",
    spreadsheetsID,
    "ranges:",
    rangeReads
  );
  try {
    var dataReturn = Sheets.Spreadsheets.Values.batchGet(spreadsheetsID, {
      ranges: rangeReads,
    });
    console.log(
      "✅ Batch read successful, got",
      dataReturn.valueRanges.length,
      "ranges"
    );
    return dataReturn;
  } catch (error) {
    console.error("❌ Batch read failed:", error);
    throw error;
  }
}

/**
 * PERFORMANCE OPTIMIZATION: Batch load all data at login
 * This function uses Sheet API batch get to load all required data in one call
 * @param {string|string[]|null} filterGroupId - Group filter for data
 * @return {Object} - Combined data from all sheets
 */
function batchLoadAllData(filterGroupId) {
  try {
    const startTime = new Date().getTime();
    console.log("🚀 Starting batch load all data...");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = ss.getId();

    // Define all ranges to batch get
    const ranges = [
      `${SHEET_NAME_GROUP}!A:Z`, // Groups data
      `${SHEET_NAME_CONG_VIEC}!A:Z`, // Work data
      `${SHEET_NAME_SETTING}!A:Z`, // Settings data
      `${SHEET_NAME_FILE_ATTACH}!A:Z`, // File attachments
    ];

    console.log("📋 Batch reading ranges:", ranges);

    // Use batch get for optimal performance
    const batchResponse = readData(spreadsheetId, ranges);

    if (!batchResponse || !batchResponse.valueRanges) {
      throw new Error("Batch get failed or returned invalid data");
    }

    const valueRanges = batchResponse.valueRanges;

    // Process each dataset
    const result = {
      success: true,
      loadTime: 0,
      data: {
        groups: processGroupsData(valueRanges[0]),
        workData: processWorkData(valueRanges[1], filterGroupId),
        settings: processSettingsData(valueRanges[2]),
        fileAttachments: processFileAttachmentsData(valueRanges[3]),
      },
    };

    const endTime = new Date().getTime();
    result.loadTime = endTime - startTime;

    console.log(`✅ Batch load completed in ${result.loadTime}ms`);
    return result;
  } catch (error) {
    console.error("❌ Error in batch load:", error);
    return {
      success: false,
      message: "Lỗi batch load: " + error.toString(),
    };
  }
}

/**
 * Process groups data from batch response
 */
function processGroupsData(valueRange) {
  try {
    if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
      return { success: true, data: [] };
    }

    const data = valueRange.values;
    const headers = data[0];
    const rows = data.slice(1);
    const result = [];

    rows.forEach((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      // Only add groups that have a valid group_id
      if (obj.group_id) {
        result.push(obj);
      }
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: "Lỗi xử lý groups: " + error.toString() };
  }
}

/**
 * Process work data from batch response with group filtering
 */
function processWorkData(valueRange, filterGroupId) {
  try {
    if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
      return { success: true, data: [] };
    }

    const data = valueRange.values;
    const headers = data[0];
    const rows = data.slice(1);

    // Find group_id column index
    const groupIdIndex = headers.indexOf("group_id");

    // Filter data based on groupId
    let filteredRows = rows;
    if (filterGroupId && groupIdIndex !== -1) {
      if (Array.isArray(filterGroupId)) {
        // Multiple groups
        filteredRows = rows.filter((row) => {
          const rowGroupId = row[groupIdIndex]
            ? row[groupIdIndex].toString()
            : "";
          return filterGroupId.includes(rowGroupId);
        });
      } else if (filterGroupId !== "NO_ACCESS") {
        // Single group
        filteredRows = rows.filter((row) => {
          const rowGroupId = row[groupIdIndex]
            ? row[groupIdIndex].toString()
            : "";
          return rowGroupId === filterGroupId.toString();
        });
      } else {
        // NO_ACCESS case
        filteredRows = [];
      }
    }

    // Convert to objects
    const result = [];
    filteredRows.forEach((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      result.push(obj);
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi xử lý work data: " + error.toString(),
    };
  }
}

/**
 * Process settings data from batch response
 */
function processSettingsData(valueRange) {
  try {
    if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
      return { success: true, data: {} };
    }

    const data = valueRange.values;
    const headers = data[0];
    const typeIndex = headers.indexOf("type");
    const valueIndex = headers.indexOf("value");

    if (typeIndex === -1 || valueIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy cột type hoặc value trong sheet Setting",
      };
    }

    // Group settings by type
    const settingsByType = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const type = row[typeIndex];
      const value = row[valueIndex];

      if (type && value) {
        if (!settingsByType[type]) {
          settingsByType[type] = [];
        }
        settingsByType[type].push(value.toString());
      }
    }

    return { success: true, data: settingsByType };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi xử lý settings: " + error.toString(),
    };
  }
}

/**
 * Process file attachments data from batch response
 */
function processFileAttachmentsData(valueRange) {
  try {
    if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
      return { success: true, data: {} };
    }
    const data = valueRange.values;
    if (data.length <= 1) {
      return { success: true, data: {} };
    }
    const headers = data[0];
    const idUniqueIndex = headers.indexOf("id_unique");

    if (idUniqueIndex === -1) {
      return { success: true, data: {} };
    }
    // Group files by id_unique
    const filesByIdUnique = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idUnique = row[idUniqueIndex];

      if (idUnique) {
        if (!filesByIdUnique[idUnique]) {
          filesByIdUnique[idUnique] = [];
        }

        const fileObj = {};
        headers.forEach((header, index) => {
          fileObj[header] = row[index] || "";
        });

        filesByIdUnique[idUnique].push(fileObj);
      }
    }

    return { success: true, data: filesByIdUnique };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi xử lý file attachments: " + error.toString(),
    };
  }
}
