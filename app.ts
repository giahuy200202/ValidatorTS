export type Result<T> = 
    | { ok: true, value: T }
    | { ok: false, message: string }

export interface ExpectedObj {
    foo: string;
    bar: number;
    baz: boolean; 
}

interface IValidator<T> {
    go(value: unknown): Result<T>;
}

type StringRule = 
    | { type: "equal", value: string }
    | { type: "notEqual", value: string }
    | { type: "minLength", min: number } 
    | { type: "maxLength", max: number }


class StringValidator implements IValidator<string> {
    constructor(private rules?: StringRule[]) {
        if (!Array.isArray(this.rules)) {
            this.rules = [];
        }
    }

    /**
     * Adds a rule to the array of rules, or replaces a rule if it already exists.
     * Use this function to prevent having multiple rules of the same type. 
     */
    private addRule: (rule: StringRule) => StringRule[] = rule => {
        // Filter the current rule set, removing any rule that has the same type of the one being added
        let filtered;
        if(this.rules!==undefined){
             filtered = this.rules.filter(r => r.type !== rule.type);
        }

        // Add the new rule to the filtered rule array 
        return [...filtered, rule]
    }

    /**
     * Fails if the value being validated is not equal to @param value.
     */
    equals: (value: string) => StringValidator = value => {
        this.rules = this.addRule({ type: "equal", value: value });
        return this;
    }

    /**
     * Fails if the value being validated is equal to @param value.
     */
    notEquals: (value: string) => StringValidator = value => {
        this.rules = this.addRule({ type: "notEqual", value: value });
        return this;
    }

    /**
     * Fails if the string's length is less than @param min.
     */
    minLength: (min: number) => StringValidator = min => {
        this.rules = this.addRule({ type: "minLength", min: min });
        return this;
    }

    /**
     * Fails if the string's length is greater than @param max.
     */
    maxLength: (max: number) => StringValidator = max => {
        this.rules = this.addRule({ type: "maxLength", max: max });
        return this;
    }

    /**
     * Fails if the string is empty.
     */
    notEmpty: () => StringValidator = () => {
        // We don't need to use a specific rule for notEmpty here, we can just set a min length of 1!
        this.rules = this.addRule({ type: "minLength", min: 1 });
        return this;
    }

    /**
     * Fails if the string is not empty. NOTE that an empty string is _not_ the same as a null or undefined value.
     */
    empty: () => StringValidator = () => {
        // Again, we don't need a specific rule for empty, we just set a max length of 0
        this.rules = this.addRule({ type: "maxLength", max: 0 });
        return this;
    }

    /**
     * Checks an individual rule against the value being validated.
     */
    checkRule: (rule: StringRule, value: string) => Result<string> = (rule, value) => {
        const err = (msg: string) => ({ ok: false, message: msg });
        const ok = () => ({ ok: true, value: value });

        switch (rule.type) {
            case "equal": 
                return rule.value !== value 
                    ? err(`Value was expected to be ${rule.value} but was ${value}.`) 
                    : ok();

            case "notEqual":
                return rule.value === value 
                    ? err(`Value must not be ${rule.value}.`) 
                    : ok();

            case "minLength":
                return value.length < rule.min 
                    ? err(`String length must be greater than or equal to ${rule.min} but was ${value.length}.`) 
                    : ok();

            case "maxLength":
                return value.length > rule.max 
                    ? err(`String length must be less than or equal to ${rule.max} but was ${value.length}.`) 
                    : ok();

            default: { 
                return ok();
            } 
        } 
    }

    go: (value: unknown) => Result<string> = value => {
        // Since the value is unknown, we must check that the type is string before validating each rule
        if (value === null) {
            return {
                ok: false,
                message: "StringValidator expected a string but received null."
            }       
        } else if (value === undefined) {
            return { 
                ok: false,
                message: "StringValidator expected a string but received undefined."
            }
        } else if (typeof value !== "string") {
            return {
                ok: false,
                message: `StringValidator expected a string but received ${typeof value}.`
            }
        }
    
        // TypeScript compiler now knows that value is a string
        // Iterate over all rules and short-circuit to return an error if any rule fails
        if(this.rules !== undefined){
            for (let rule of this.rules) {
                const result = this.checkRule(rule, value);
        
                if (result.ok === false) {
                    return result;
                }       
            }
        }
    
        // If none of the rules in the loop had an error, the value passed validation!
        return {
            ok: true,
            value: value
        }
    }
}

const validator = new StringValidator().notEmpty().maxLength(20).notEquals("foo");
const go = (value: string) => {
    const result = validator.go(value);

    if (!result.ok) {
        console.error(result.message);
    } else {
        console.log(`String value is valid: ${result.value}.`);
    }
}

go("foo"); // String value is valid: foo.
go("bar"); // Value must not be bar.
go("something longer than 20"); // String length must be less than or equal to 20 but was 24.