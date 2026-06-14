# Angular Project Instructions

## Operating mode

Người dùng chỉ cần mô tả kết quả mong muốn bằng ngôn ngữ tự nhiên, ví dụ:

* `Tạo component user-card để hiển thị thông tin người dùng`
* `Thêm bộ lọc trạng thái vào trang danh sách đơn hàng`
* `Sửa lỗi form đăng nhập không hiển thị validation`
* `Refactor order service để tránh gọi API trùng`
* `Viết test cho component checkout`
* `Debug lỗi giao diện trên mobile`

Tự phân tích repository, chọn workflow phù hợp và thực hiện tác vụ. Không yêu cầu người dùng phải chỉ định file, command, skill, plugin, test runner hoặc kiến trúc Angular.

Nếu yêu cầu đã đủ rõ, bắt đầu ngay. Chỉ hỏi lại khi thiếu dữ liệu bắt buộc không tồn tại trong repository.

## Instruction priority

Tuân thủ theo thứ tự:

1. Yêu cầu hiện tại của người dùng.
2. `AGENTS.md` gần file đang sửa nhất.
3. Kiến trúc và conventions hiện có.
4. Cấu hình Angular, TypeScript, lint, test và build.
5. Quy tắc trong file này.
6. Workflow từ plugin.

Không áp dụng quy tắc chung nếu xung đột với cấu hình hoặc pattern đang tồn tại trong project.

## Automatic workflow selection

Tự xác định loại tác vụ:

### UI implementation

Khi người dùng yêu cầu tạo hoặc sửa:

* component;
* page;
* layout;
* form;
* table;
* modal;
* navigation;
* responsive UI;
* accessibility;
* interaction trên trình duyệt.

Áp dụng workflow tương đương `frontend-app-builder` từ plugin Build Web Apps.

Phải:

* giữ Angular và TypeScript;
* dùng component, style system và UI library hiện có;
* kiểm tra loading, empty, error và responsive state khi liên quan;
* tái sử dụng design token và component sẵn có;
* không áp dụng React, Next.js hoặc shadcn patterns.

### UI debugging and browser behavior

Khi người dùng yêu cầu:

* sửa lỗi giao diện;
* debug hành vi tương tác;
* tái hiện lỗi trên trình duyệt;
* kiểm tra responsive;
* kiểm tra route, form hoặc user flow;
* sửa lỗi chỉ xuất hiện khi chạy ứng dụng.

Áp dụng workflow tương đương `frontend-testing-debugging` từ plugin Build Web Apps.

Phải:

1. Tái hiện lỗi nếu môi trường cho phép.
2. Xác định nguyên nhân trực tiếp.
3. Sửa với phạm vi nhỏ nhất.
4. Kiểm tra lại đúng flow đã lỗi.
5. Chạy test hoặc build liên quan.

### Angular code task

Với service, guard, interceptor, pipe, directive, state, API, model, validation, unit test hoặc refactor TypeScript thông thường:

* không cần dùng Build Web Apps;
* làm theo cấu hình và pattern Angular hiện có;
* chỉ đọc context trực tiếp liên quan.

### Stripe hoặc Supabase

Chỉ áp dụng workflow Stripe hoặc Supabase từ Build Web Apps khi project thực sự đang sử dụng dịch vụ tương ứng hoặc người dùng yêu cầu tích hợp chúng.

Không tự thêm Stripe hoặc Supabase.

## Plugin restrictions

Build Web Apps chỉ là nguồn workflow hỗ trợ. `AGENTS.md` và conventions của repository luôn có ưu tiên cao hơn.

Được dùng:

* `frontend-app-builder`;
* `frontend-testing-debugging`;
* `stripe-best-practices` khi có Stripe;
* `supabase-best-practices` khi có Supabase.

Không dùng trong Angular project:

* `react-best-practices`;
* `shadcn-best-practices`;
* React conventions;
* Next.js conventions;
* React hooks;
* JSX patterns;
* shadcn component architecture.

Không cần nhắc lại với người dùng plugin hoặc skill nào đã được chọn.

## Context budget

Chỉ đọc dữ liệu cần thiết để hoàn thành tác vụ.

Mặc định bắt đầu với:

* `package.json`;
* `angular.json`;
* file hoặc feature trực tiếp liên quan;
* test tương ứng nếu có;
* tối đa 2 implementation tương tự gần nhất.

Chỉ đọc thêm khi:

* có dependency trực tiếp;
* cần xác định type hoặc public API;
* cần tìm route, provider, state hoặc shared component;
* validation thất bại và cần truy vết nguyên nhân.

Không:

* quét toàn bộ repository;
* đọc toàn bộ `src`;
* đọc mọi file cấu hình khi không liên quan;
* mở file chỉ để lấy context chung;
* phân tích lại file không thay đổi;
* lặp lại nội dung file trong phản hồi;
* sinh plan hoặc summary dài;
* tải toàn bộ dependency tree.

Ưu tiên tìm theo:

* symbol;
* selector;
* route;
* import;
* method;
* error message;
* tên component hoặc service.

## Project discovery

Tự xác định từ repository khi cần:

* Angular version;
* standalone hay NgModule;
* package manager;
* strict TypeScript;
* test runner;
* lint command;
* build command;
* state management;
* UI library;
* styling system;
* form strategy;
* dependency injection pattern.

Không hỏi người dùng các thông tin có thể lấy từ repository.

Không suy đoán phiên bản hoặc công nghệ.

## Scope control

Trước khi sửa, tự xác định nội bộ:

* kết quả người dùng yêu cầu;
* hành vi cần giữ nguyên;
* file tối thiểu cần thay đổi;
* cách xác minh hoàn thành.

Không xuất phần phân tích này trừ khi người dùng yêu cầu.

Thực hiện thay đổi nhỏ nhất đáp ứng đủ yêu cầu.

Không:

* refactor ngoài phạm vi;
* sửa lỗi không liên quan;
* thay đổi kiến trúc;
* đổi tên hoặc di chuyển file không cần thiết;
* thay đổi public API nếu không bắt buộc;
* tạo abstraction cho một trường hợp dùng duy nhất;
* thêm tính năng người dùng không yêu cầu.

Nếu phát hiện lỗi ngoài phạm vi, không tự sửa.

## Angular implementation rules

* Dùng API tương thích với phiên bản Angular đang cài.
* Giữ nguyên standalone hoặc NgModule architecture hiện tại.
* Không trộn hai kiến trúc nếu không có lý do trực tiếp.
* Theo dependency injection pattern đang dùng.
* Theo signal, RxJS hoặc state-management pattern hiện có.
* Không tự chuyển Observable sang Signal hoặc ngược lại.
* Theo reactive forms hoặc template-driven forms hiện có.
* Với component mới, tham khảo component tương tự gần nhất.
* Giữ naming, folder structure và import style hiện tại.
* Tái sử dụng component, service, pipe, directive và utility sẵn có.
* Dùng strict typing.
* Không dùng `any` nếu có thể biểu diễn type chính xác.
* Không dùng `@ts-ignore` để che lỗi.
* Không tắt lint rule để làm code pass.
* Không thay đổi change detection nếu không cần thiết.
* Không đặt business logic phức tạp trong template.
* Không gọi function có side effect từ template.
* Cleanup subscription theo cơ chế project đang sử dụng.
* Không hard-code secret hoặc environment-specific URL.

## Component creation rules

Khi người dùng nhập:

`Tạo component <tên> để <mục đích>`

Tự thực hiện:

1. Xác định vị trí phù hợp từ cấu trúc feature hiện tại.
2. Xác định standalone hay NgModule.
3. Tìm component tương tự gần nhất.
4. Tạo đủ file theo conventions của project.
5. Khai báo hoặc import component nếu kiến trúc yêu cầu.
6. Thêm input, output và type cần thiết.
7. Tạo template và style tối thiểu phục vụ mục đích.
8. Thêm test nếu project đang duy trì test cho loại component này.
9. Chạy validation liên quan.

Không yêu cầu người dùng cung cấp:

* đường dẫn file;
* selector;
* standalone flag;
* module;
* test command;
* style format;

trừ khi repository không cung cấp đủ dữ liệu để xác định.

## Feature implementation rules

Khi người dùng mô tả một feature:

1. Tìm feature hoặc page liên quan.
2. Xác định data flow hiện tại.
3. Tái sử dụng API, service và state hiện có.
4. Chỉ tạo model hoặc service mới khi thật sự cần.
5. Triển khai success, loading, empty và error state khi liên quan.
6. Giữ backward compatibility trong phạm vi có thể.
7. Thêm hoặc cập nhật test cho hành vi mới.
8. Xác minh bằng command hiện có.

## Bug fixing rules

Khi người dùng nhập:

`Sửa lỗi <mô tả lỗi>`

Tự thực hiện:

1. Tìm vị trí liên quan bằng error, route, selector hoặc hành vi.
2. Tái hiện bằng test hoặc runtime nếu khả thi.
3. Xác định nguyên nhân gốc có dữ liệu chứng minh.
4. Không sửa dựa trên phỏng đoán.
5. Thực hiện patch nhỏ nhất.
6. Thêm regression test khi phù hợp.
7. Chạy lại validation trực tiếp liên quan.

Nếu không đủ dữ liệu để xác minh nguyên nhân, ghi:

`Không đủ dữ liệu để xác minh nguyên nhân.`

## Refactoring rules

Chỉ refactor khi người dùng yêu cầu hoặc khi bắt buộc để hoàn thành tác vụ.

Refactor phải:

* giữ nguyên behavior;
* không đổi public API nếu không được yêu cầu;
* không tạo thêm abstraction không cần thiết;
* giảm duplication hoặc complexity có thể chứng minh;
* có test hoặc validation bảo vệ behavior.

## Dependency rules

* Ưu tiên package manager xác định từ lockfile.
* Không chạy install nếu dependency đã tồn tại.
* Không thêm dependency khi có thể dùng Angular hoặc utility hiện có.
* Không nâng version package nếu không được yêu cầu.
* Không thay lockfile nếu dependency không thay đổi.
* Không xóa `node_modules`, cache hoặc generated files tùy tiện.

Khi bắt buộc thêm dependency:

1. Xác minh project chưa có giải pháp tương đương.
2. Chọn package tương thích với Angular version hiện tại.
3. Chỉ cài package cần thiết.
4. Ghi rõ dependency đã thêm trong kết quả.

## Testing and validation

Đọc scripts trong `package.json` và dùng command thực tế của project.

Thứ tự ưu tiên:

1. test trực tiếp của file hoặc feature;
2. lint hoặc typecheck liên quan;
3. production build khi thay đổi ảnh hưởng compile;
4. browser flow khi tác vụ liên quan UI runtime.

Không:

* tự mặc định project dùng Karma, Jest hoặc Vitest;
* chạy toàn bộ test suite nhiều lần không cần thiết;
* sửa test không liên quan;
* xóa hoặc skip test;
* làm yếu assertion để test pass;
* khẳng định command thành công nếu chưa chạy;
* chạy formatter toàn repository cho thay đổi cục bộ.

Nếu validation thất bại do lỗi có sẵn và không liên quan, không tự sửa. Ghi rõ command và lỗi liên quan.

## Command safety

Không chạy command destructive.

Không tự:

* xóa file;
* reset Git;
* discard thay đổi hiện có;
* force checkout;
* rewrite history;
* xóa database;
* chạy migration phá dữ liệu;
* thay đổi environment production.

Giữ nguyên các thay đổi chưa commit của người dùng không liên quan đến tác vụ.

## User command examples

Các prompt sau phải được hiểu và thực hiện trực tiếp:

### Tạo component

`Tạo component order-summary để hiển thị tổng tiền đơn hàng`

### Tạo page

`Tạo trang quản lý người dùng có tìm kiếm và phân trang`

### Thêm chức năng

`Thêm bộ lọc ngày vào danh sách giao dịch`

### Sửa lỗi

`Sửa lỗi nút submit vẫn bấm được khi form invalid`

### Refactor

`Refactor product service để tránh duplicate request`

### Viết test

`Viết unit test cho login component`

### Debug UI

`Debug lỗi modal bị tràn màn hình trên mobile`

### Tích hợp API

`Kết nối trang order detail với API lấy chi tiết đơn hàng`

### Tối ưu

`Tối ưu component dashboard đang render lại quá nhiều`

Không yêu cầu người dùng viết thêm prompt về Angular rules, plugin, context budget hoặc validation.

## Final response format

Chỉ trả về:

### Đã làm

Tối đa 3 gạch đầu dòng, mô tả kết quả thực tế.

### File thay đổi

Chỉ liệt kê file đã sửa hoặc tạo.

### Kiểm tra

Liệt kê command đã chạy cùng trạng thái:

* `PASS`
* `FAIL`
* `NOT RUN`

### Còn lại

Chỉ xuất phần này khi:

* có lỗi chưa xử lý;
* command không thể chạy;
* thiếu dữ liệu để xác minh;
* tồn tại vấn đề ngoài phạm vi ảnh hưởng trực tiếp đến kết quả.

Không:

* kể lại quá trình suy luận;
* chép toàn bộ code;
* giải thích kiến thức Angular chung;
* liệt kê file chỉ đọc;
* nhắc lại yêu cầu;
* đề xuất thêm việc ngoài phạm vi;
* mô tả plugin đã sử dụng.
