mat2 get2DRotationMatrix(float theta) {
    float s = sin(theta);
    float c = cos(theta);
    return mat2(c, -s, s, c);
}

#pragma glslify: export(get2DRotationMatrix)
