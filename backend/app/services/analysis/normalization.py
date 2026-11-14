import math
import statistics


def validate_values(values):
    if not values:
        raise ValueError("Values cannot be empty.")

    if any(
        not isinstance(value, (int, float))
        or not math.isfinite(value)
        for value in values
    ):
        raise ValueError("All values must be finite numbers.")


def z_score(values):
    validate_values(values)

    mean = statistics.fmean(values)
    std = statistics.pstdev(values)

    if std == 0:
        return [0.0 for _ in values]

    return [
        (value - mean) / std
        for value in values
    ]


def min_max_scale(values):
    validate_values(values)

    minimum = min(values)
    maximum = max(values)

    if maximum == minimum:
        return [0.0 for _ in values]

    return [
        (value - minimum) / (maximum - minimum)
        for value in values
    ]


def robust_scale(values):
    validate_values(values)

    ordered = sorted(values)

    median = statistics.median(ordered)

    q1, _, q3 = statistics.quantiles(
        ordered,
        n=4,
        method="inclusive",
    )

    iqr = q3 - q1

    if iqr == 0:
        return [0.0 for _ in values]

    return [
        (value - median) / iqr
        for value in values
    ]
