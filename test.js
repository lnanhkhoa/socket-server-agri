const util = require('./core/util');
const moment = require('moment');

/*

access token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJsZXZlbCI6Im1lcmNoYW50IiwiZXhwIjoxNTU2ODk5MDI4LCJpYXQiOjE1MjUzNjMwMjgsIm1lcmNoYW50X2lkIjo1LCJuYmYiOjE1MjUzNjMwMjgsImlkZW50aXR5Ijo4fQ.JcClw55kX3iVQAgVWjeoMHDlRTZ-WtPB9gXAa_eWoiA

*/

(async () => {
    const merchantDao = require('./database/dao/user_order');
    console.log(merchantDao);
    const config = merchantDao.config.STATE;
    console.log(merchantDao);
    console.log(merchantDao.config.STATE);
})().catch(e => {
    console.error(e)
});