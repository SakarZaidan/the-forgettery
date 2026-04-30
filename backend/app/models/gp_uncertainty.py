import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel as C, WhiteKernel
from app.config import settings

class UncertaintyModel:
    """
    Gaussian Process model to predict spatial uncertainty across the grid.
    Used to drive the 'Fog of War' based on where the player has demonstrated mastery.
    """
    
    def __init__(self):
        # Kernel: Amplitude * Smoothness + Noise
        # ConstantKernel (C) models the overall variance
        # RBF models the spatial correlation (smoothness)
        # WhiteKernel models observation noise
        kernel = (
            C(1.0, (1e-3, 1e3)) * 
            RBF(length_scale=settings.gp_length_scale, length_scale_bounds=(0.1, 10.0)) + 
            WhiteKernel(noise_level=0.1, noise_level_bounds=(1e-5, 1.0))
        )
        
        self.gp = GaussianProcessRegressor(
            kernel=kernel,
            normalize_y=True,
            alpha=1e-3, # Numerical stability
            n_restarts_optimizer=5
        )
        self.fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Fits the GP model to demonstrated performance at specific grid points."""
        if len(X) < 2:
            self.fitted = False
            return
            
        try:
            # X should be feature vectors from ConceptGraph
            # y should be accuracy (n_correct / n_exposures)
            self.gp.fit(X, y)
            self.fitted = True
        except Exception as e:
            print(f"[GP] Fit Error: {e}")
            self.fitted = False

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """
        Predicts mean performance and uncertainty (std) for all points in X.
        Returns: (mean, std)
        """
        if not self.fitted:
            # If not fitted, return maximum uncertainty (0.5) and neutral mean (0.5)
            return np.full(len(X), 0.5), np.full(len(X), 0.5)
            
        try:
            mean, std = self.gp.predict(X, return_std=True)
            return mean, std
        except Exception as e:
            print(f"[GP] Predict Error: {e}")
            return np.full(len(X), 0.5), np.full(len(X), 0.5)
