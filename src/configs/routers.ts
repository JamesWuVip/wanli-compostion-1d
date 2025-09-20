import INDEX from '../pages/index.jsx';
import CAMERA from '../pages/camera.jsx';
import RESULT from '../pages/result.jsx';
import HISTORY from '../pages/history.jsx';
import OCR_CONFIRM from '../pages/ocr_confirm.jsx';
import LOGIN from '../pages/login.jsx';
import HISTORY_DETAIL from '../pages/history_detail.jsx';
export const routers = [{
  id: "index",
  component: INDEX
}, {
  id: "camera",
  component: CAMERA
}, {
  id: "result",
  component: RESULT
}, {
  id: "history",
  component: HISTORY
}, {
  id: "ocr_confirm",
  component: OCR_CONFIRM
}, {
  id: "login",
  component: LOGIN
}, {
  id: "history_detail",
  component: HISTORY_DETAIL
}]