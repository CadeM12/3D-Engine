class Matrix{
    constructor(matrix){
        this.matrix = matrix;
    }
}

class Vector {
    constructor(x, y, z, w = 1){
        this.vector = [x, y, z, w];
    }

    multiply(matrix){
        let result = [0, 0, 0, 0];
        
        for(let i = 0; i < 4; i++){
            for (let j = 0; j < 4; j++){
                result[i] += this.vector[j] * matrix[i][j];
            }
        }

        return result;
    }
}

export { Matrix, Vector };