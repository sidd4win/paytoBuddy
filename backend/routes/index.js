const express=require("express");

const userRouter=require("./user");
const accountRouter = require('./account'); 
const adminRouter = require('./admin');
const router=express.Router();


router.use("/user",userRouter);
router.use('/account', accountRouter);
router.use('/admin', adminRouter);
const paymentRouter = require('./payment');
router.use('/payment', paymentRouter);
module.exports=router;
