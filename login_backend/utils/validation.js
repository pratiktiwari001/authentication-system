const validator = require("validator");

const isValid = (req, res)=>{
    const { name, email, phone, password } = req.body;

    if(!name || !email || !phone || !password){
        throw new Error("All core fields are required.");
    }

    const cleanName = validator.trim(name)
    const cleanEmail = validator.trim(email)

    if(!validator.isEmail(cleanEmail)){
        throw new Error( "This is not a valid email" );
    }
    if(!validator.isMobilePhone(phone, "en-IN")){
       throw new Error ("Enter a Valid Phone Number" );
    }
    const isStrong = validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    });

    if (!isStrong) {
        throw new Error("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special symbols.");
    }

    return {
        name: validator.escape(cleanName),
        email: validator.normalizeEmail(cleanEmail),
        password, // Keep raw for hashing via bcrypt in the controller
        phone: phone ? phone.replace(/\D/g, '').slice(-10) : undefined // normalizes to pure 10 digits
    };
}

module.exports = {isValid};
