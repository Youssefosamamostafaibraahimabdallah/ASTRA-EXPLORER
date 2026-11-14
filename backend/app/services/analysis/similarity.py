import math


def compare_features(
    location_a: dict[str, float],
    location_b: dict[str, float],
    tolerances: dict[str, float],
    weights: dict[str, float] | None = None,
) -> dict:
    """
    Compare two locations using tolerance-based feature similarity.

    Similarity for each feature:
        exp(-absolute_difference / tolerance)

    A tolerance is the characteristic difference scale for that
    feature. It must be positive and expressed in the same unit
    as the feature being compared.

    Missing features are excluded from the score.
    """

    if not isinstance(location_a, dict) or not isinstance(location_b, dict):
        raise TypeError("Both locations must be dictionaries.")

    if not isinstance(tolerances, dict) or not tolerances:
        raise ValueError("Tolerances must be a non-empty dictionary.")

    if weights is None:
        weights = {}

    if not isinstance(weights, dict):
        raise TypeError("Weights must be a dictionary.")

    def validate_measurements(data: dict, name: str) -> None:
        for feature, value in data.items():
            if (
                not isinstance(value, (int, float))
                or isinstance(value, bool)
                or not math.isfinite(value)
            ):
                raise ValueError(
                    f"{name}.{feature} must be a finite number."
                )

    validate_measurements(location_a, "location_a")
    validate_measurements(location_b, "location_b")

    for feature, tolerance in tolerances.items():
        if (
            not isinstance(tolerance, (int, float))
            or isinstance(tolerance, bool)
            or not math.isfinite(tolerance)
            or tolerance <= 0
        ):
            raise ValueError(
                f"Tolerance for '{feature}' must be positive and finite."
            )

    for feature, weight in weights.items():
        if (
            not isinstance(weight, (int, float))
            or isinstance(weight, bool)
            or not math.isfinite(weight)
            or weight < 0
        ):
            raise ValueError(
                f"Weight for '{feature}' must be finite and non-negative."
            )

    shared_features = (
        set(location_a)
        & set(location_b)
        & set(tolerances)
    )

    if not shared_features:
        raise ValueError(
            "No shared features with defined tolerances are available."
        )

    feature_results = {}
    weighted_similarity_sum = 0.0
    total_weight = 0.0

    for feature in sorted(shared_features):
        value_a = float(location_a[feature])
        value_b = float(location_b[feature])
        tolerance = float(tolerances[feature])

        weight = float(weights.get(feature, 1.0))

        difference = abs(value_a - value_b)

        similarity = math.exp(-difference / tolerance)

        feature_results[feature] = {
            "location_a": value_a,
            "location_b": value_b,
            "absolute_difference": round(difference, 6),
            "tolerance": tolerance,
            "weight": weight,
            "similarity": round(similarity, 6),
            "similarity_percent": round(similarity * 100, 2),
        }

        weighted_similarity_sum += similarity * weight
        total_weight += weight

    if total_weight == 0:
        raise ValueError(
            "At least one compared feature must have a positive weight."
        )

    overall_similarity = weighted_similarity_sum / total_weight

    all_features = set(location_a) | set(location_b)
    coverage = len(shared_features) / len(all_features) * 100

    return {
        "overall_similarity": round(overall_similarity, 6),
        "overall_similarity_percent": round(
            overall_similarity * 100, 2
        ),
        "compared_features": len(shared_features),
        "available_features": len(all_features),
        "feature_coverage_percent": round(coverage, 2),
        "method": "Exponential tolerance-based similarity",
        "features": feature_results,
        "interpretation": (
            "Exploratory similarity index. "
            "Not a validated planetary analog classification."
        ),
    }
